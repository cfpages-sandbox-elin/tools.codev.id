from __future__ import annotations

import hashlib
import os
import runpy
import shutil
import stat
import subprocess
import sys
import tempfile
from pathlib import Path

EXPECTED = "installed_markdown_index_contract: PASS"
OPEN = '<div class="entry-content single-content">'
CLOSE = "<!-- .entry-content -->"
TRANSFORMER_NAME = "update_index_from_markdown_html.py"
CANONICAL_TRANSFORMER_SHA256 = "b51d5f84eb566de8ab653405d3978468277297748afb96aae325bc94bf9d5a13"


def is_regular_file(path: Path, label: str) -> bool:
    try:
        mode = path.lstat().st_mode
    except FileNotFoundError:
        return False
    assert stat.S_ISREG(mode), f"{label} is not a regular file: {path}"
    return True


def locate_transformer() -> tuple[Path, bool]:
    test_file = Path(__file__).absolute()
    sibling = test_file.with_name(TRANSFORMER_NAME)
    if is_regular_file(sibling, "sibling transformer"):
        return sibling, True
    if test_file.parent.name != "tests":
        raise AssertionError(f"installed sibling transformer is absent: {sibling}")
    source = test_file.parents[1] / "canonical" / "scripts" / TRANSFORMER_NAME
    assert is_regular_file(source, "canonical source transformer"), f"canonical source transformer is absent: {source}"
    return source, False


def run_transform(script: Path, index: Path, fragment: Path, expect: int = 0) -> subprocess.CompletedProcess[str]:
    p = subprocess.run([sys.executable, "-B", str(script), str(index), str(fragment)], text=True, capture_output=True)
    assert p.returncode == expect, (p.returncode, p.stdout, p.stderr)
    return p


def assert_symlink_mode_rejected(script: Path) -> None:
    namespace = runpy.run_path(str(script), run_name="update_index_from_markdown_html_contract_test")

    class SyntheticSymlink:
        def lstat(self) -> os.stat_result:
            return os.stat_result((stat.S_IFLNK, 0, 0, 0, 0, 0, 0, 0, 0, 0))

        def __str__(self) -> str:
            return "synthetic-symlink"

    try:
        namespace["regular"](SyntheticSymlink())
    except ValueError:
        return
    raise AssertionError("symlink mode was not rejected")


def fixture(newline: str, final: bool = True, body_titles: bool = False) -> bytes:
    svg_titles = ""
    if body_titles:
        svg_titles = '\n'.join(
            f'<svg data-icon="{number}"><title id="svg-title-{number}">Icon {number}</title><path d="M{number} 0"/></svg>'
            for number in range(1, 16)
        ) + "\n"
    s = f"<html>\n<head>\n<title>Old</title>\n</head>\n<body>\n{svg_titles}{OPEN}\nold\n</div>\n{CLOSE}\n</body>\n</html>"
    s = s.replace("\n", newline)
    return (s + (newline if final else "")).encode()


def poison(script: Path, base: bytes, fragment: bytes, mutate: str) -> None:
    with tempfile.TemporaryDirectory() as td:
        d = Path(td); idx = d / "index.html"; frag = d / "fragment.html"
        idx.write_bytes(base); frag.write_bytes(fragment)
        if mutate == "invalid-utf8": idx.write_bytes(base + b"\xff")
        elif mutate == "duplicate-marker": idx.write_bytes(base.replace(OPEN.encode(), (OPEN + "\n" + OPEN).encode()))
        elif mutate == "missing-marker": idx.write_bytes(base.replace(OPEN.encode(), b"<div>"))
        elif mutate == "reversed": idx.write_bytes(base.replace(OPEN.encode(), b"<div>").replace(CLOSE.encode(), (CLOSE + "\n" + OPEN).encode()))
        elif mutate == "detached-close": idx.write_bytes(base.replace(b"</div>\n" + CLOSE.encode(), b"</div>\n<p>gap</p>\n" + CLOSE.encode()))
        elif mutate == "combined-close": idx.write_bytes(base.replace(b"</div>\n" + CLOSE.encode(), b"</div>" + CLOSE.encode()))
        elif mutate == "missing-head": idx.write_bytes(base.replace(b"<head>\n", b"").replace(b"</head>\n", b""))
        elif mutate == "duplicate-head": idx.write_bytes(base.replace(b"<head>\n<title>Old</title>\n</head>", b"<head>\n<title>Old</title>\n</head>\n<head>\n<title>Two</title>\n</head>"))
        elif mutate == "missing-title": idx.write_bytes(base.replace(b"<title>Old</title>", b""))
        elif mutate == "duplicate-title": idx.write_bytes(base.replace(b"<title>Old</title>", b"<title>Old</title><title>Two</title>"))
        elif mutate == "same-path": frag = idx
        elif mutate == "symlink":
            try:
                frag.unlink()
                os.symlink(idx, frag)
            except OSError as exc:
                if os.name == "nt" and getattr(exc, "winerror", None) == 1314:
                    assert_symlink_mode_rejected(script)
                    return
                raise
        elif mutate == "non-regular":
            frag.unlink()
            frag.mkdir()
        elif mutate == "missing-input":
            frag.unlink()
        before = idx.read_bytes()
        run_transform(script, idx, frag, 2)
        assert idx.read_bytes() == before


def main() -> int:
    script, installed_layout = locate_transformer()
    assert hashlib.sha256(script.read_bytes()).hexdigest() == CANONICAL_TRANSFORMER_SHA256
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        for number, (nl, final) in enumerate([("\n", True), ("\r\n", True), ("\n", False), ("\r\n", False)]):
            idx = d / f"index-{number}.html"; frag = d / "fragment.html"
            idx.write_bytes(fixture(nl, final)); frag.write_bytes(b'<p class="q">"$HOME" &amp; ${VALUE}</p>\n<p>second</p>\n')
            run_transform(script, idx, frag)
            out = idx.read_bytes(); assert (b"\r\n" in out) == (nl == "\r\n"); assert out.endswith(b"\n") == final
            before = out; run_transform(script, idx, frag); assert idx.read_bytes() == before

        # Match the live repository shape: one page title in head plus 15 SVG
        # accessibility titles in body. Only the page title and managed region
        # may change; every body SVG title byte must remain untouched.
        idx = d / "current-shape-index.html"
        frag = d / "current-shape-fragment.html"
        before = fixture("\n", False, body_titles=True)
        idx.write_bytes(before)
        frag.write_bytes(b"<h2>Rendered tools</h2>\n<p>Current repository shape</p>\n")
        run_transform(script, idx, frag)
        expected = before.replace(b"<title>Old</title>", b"<title>Tools</title>", 1).replace(
            (OPEN + "\nold\n</div>").encode(),
            (OPEN + "\n  <h2>Rendered tools</h2>\n  <p>Current repository shape</p>\n</div>").encode(),
            1,
        )
        assert idx.read_bytes() == expected
        svg_titles = [f'<title id="svg-title-{number}">Icon {number}</title>'.encode() for number in range(1, 16)]
        assert all(idx.read_bytes().count(title) == 1 for title in svg_titles)
        run_transform(script, idx, frag)
        assert idx.read_bytes() == expected

    base = fixture("\n", body_titles=True)
    for name in ("invalid-utf8", "duplicate-marker", "missing-marker", "reversed", "detached-close", "combined-close", "missing-head", "duplicate-head", "missing-title", "duplicate-title", "same-path", "symlink", "non-regular", "missing-input"):
        poison(script, base, b"<p>x</p>\n", name)

    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        idx = d / "index.html"
        frag = d / "fragment.html"
        idx.write_bytes(base)
        frag.write_bytes(b"<p>x</p>\n")
        before = idx.read_bytes()
        p = subprocess.run([sys.executable, "-B", str(script), str(idx), str(frag), "unexpected"], text=True, capture_output=True)
        assert p.returncode == 2, (p.returncode, p.stdout, p.stderr)
        assert idx.read_bytes() == before
    # Execute the exact workflow command from a source-absent layout.
    if not installed_layout:
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); installed = root / ".github" / "scripts"; installed.mkdir(parents=True)
            shutil.copy2(script, installed / script.name)
            shutil.copy2(Path(__file__), installed / Path(__file__).name)
            assert hashlib.sha256((installed / script.name).read_bytes()).hexdigest() == CANONICAL_TRANSFORMER_SHA256
            assert sorted(path.name for path in installed.iterdir()) == sorted([script.name, Path(__file__).name])
            assert not (root / ".github" / "canonical").exists()
            env = os.environ.copy(); env.pop("PYTHONPATH", None); env.pop("INSTALLED_LAYOUT", None)
            p = subprocess.run([sys.executable, "-B", ".github/scripts/test_update_index_from_markdown_html.py"], cwd=root, env=env, text=True, capture_output=True)
            assert p.returncode == 0, (p.stdout, p.stderr)
            assert p.stdout.strip() == EXPECTED

        # An installed-shape test without its sibling must fail before the old
        # relative source fallback can find even a deliberately planted decoy.
        with tempfile.TemporaryDirectory() as td:
            root = Path(td); installed = root / ".github" / "scripts"; installed.mkdir(parents=True)
            decoy = root / ".github" / "canonical" / "scripts" / script.name; decoy.parent.mkdir(parents=True)
            shutil.copy2(Path(__file__), installed / Path(__file__).name)
            shutil.copy2(script, decoy)
            before = {path.relative_to(root): path.read_bytes() for path in root.rglob("*") if path.is_file()}
            env = os.environ.copy(); env.pop("PYTHONPATH", None); env.pop("INSTALLED_LAYOUT", None)
            p = subprocess.run([sys.executable, "-B", ".github/scripts/test_update_index_from_markdown_html.py"], cwd=root, env=env, text=True, capture_output=True)
            assert p.returncode != 0, (p.stdout, p.stderr)
            assert "installed sibling transformer is absent" in p.stderr
            assert EXPECTED not in p.stdout
            after = {path.relative_to(root): path.read_bytes() for path in root.rglob("*") if path.is_file()}
            assert after == before
    print(EXPECTED)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
