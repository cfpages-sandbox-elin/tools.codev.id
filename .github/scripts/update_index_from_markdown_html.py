#!/usr/bin/env python3
"""Replace the generated entry region in index.html safely and deterministically."""
from __future__ import annotations

import argparse
import re
import stat
import sys
from pathlib import Path

OPEN = '<div class="entry-content single-content">'
CLOSE_COMMENT = '<!-- .entry-content -->'
CLOSING_DIV = '</div>'
HEAD_RE = re.compile(r"<head\b[^>]*>.*?</head\s*>", re.IGNORECASE | re.DOTALL)
TITLE_RE = re.compile(r"<title\b[^>]*>(.*?)</title\s*>", re.IGNORECASE | re.DOTALL)


def regular(path: Path) -> None:
    st = path.lstat()
    if stat.S_ISLNK(st.st_mode) or not stat.S_ISREG(st.st_mode):
        raise ValueError(f"path must be a regular non-symlink file: {path}")


def newline_style(data: bytes) -> tuple[str, bool]:
    if b"\r\n" in data:
        style = "\r\n"
    else:
        style = "\n"
    return style, data.endswith(b"\n")


def transform(index_path: Path, fragment_path: Path) -> bytes:
    regular(index_path)
    regular(fragment_path)
    if index_path.resolve() == fragment_path.resolve():
        raise ValueError("input and output paths must differ")
    raw = index_path.read_bytes()
    fragment_raw = fragment_path.read_bytes()
    style, final_nl = newline_style(raw)
    try:
        text = raw.decode("utf-8")
        fragment = fragment_raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError("invalid UTF-8 input") from exc
    # Normalize all source line boundaries, then render with destination style.
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    fragment = fragment.replace("\r\n", "\n").replace("\r", "\n")
    heads = list(HEAD_RE.finditer(text))
    if len(heads) != 1:
        raise ValueError("index.html must contain exactly one head element")
    head = heads[0]
    head_text = head.group(0)
    titles = list(TITLE_RE.finditer(head_text))
    if len(titles) != 1:
        raise ValueError("index.html head must contain exactly one title element")
    title = titles[0]
    content_start = title.start(1) - title.start()
    content_end = title.end(1) - title.start()
    replacement_title = title.group(0)[:content_start] + "Tools" + title.group(0)[content_end:]
    head_text = head_text[: title.start()] + replacement_title + head_text[title.end() :]
    text = text[: head.start()] + head_text + text[head.end() :]

    lines = text.split("\n")
    opens = [i for i, line in enumerate(lines) if OPEN in line]
    closes = [i for i, line in enumerate(lines) if CLOSE_COMMENT in line]
    if len(opens) != 1 or len(closes) != 1:
        raise ValueError("index.html must contain exactly one open marker and close comment")
    oi, ci = opens[0], closes[0]
    if ci <= oi:
        raise ValueError("close comment must follow open marker")
    preceding = ci - 1
    while preceding > oi and not lines[preceding].strip():
        preceding -= 1
    if preceding <= oi or lines[preceding].strip() != CLOSING_DIV:
        raise ValueError("close comment must immediately follow the region closing div")
    open_indent = lines[oi][: len(lines[oi]) - len(lines[oi].lstrip(" \t"))]
    indent = open_indent + "  "
    frag_lines = fragment.split("\n")
    # A trailing newline in the fragment is represented by split's final empty item;
    # omit it so the destination's own final-newline policy remains authoritative.
    while frag_lines and frag_lines[-1] == "":
        frag_lines.pop()
    rendered = [indent + line if line else indent.rstrip() for line in frag_lines]
    lines[oi + 1 : preceding] = rendered
    result = "\n".join(lines)
    if final_nl:
        if not result.endswith("\n"):
            result += "\n"
    else:
        result = result.rstrip("\n")
    return result.replace("\n", style).encode("utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("index_html")
    parser.add_argument("fragment_html")
    args = parser.parse_args(argv)
    try:
        output = transform(Path(args.index_html), Path(args.fragment_html))
        Path(args.index_html).write_bytes(output)
    except (OSError, ValueError) as exc:
        print(f"update_index_from_markdown_html: error: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
