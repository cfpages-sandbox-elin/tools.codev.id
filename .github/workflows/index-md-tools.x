name: Update Tools Index from Markdown

on:
  push:
    branches: [ "main" ]
  workflow_dispatch: # Manual trigger

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Check for index.md and create if not exists
        run: |
          if [ ! -f index.md ]; then
            echo "# Tools Directory\n\nNo tools listed yet. Add tools and update this file." > index.md
            echo "Created default index.md"
          else
            echo "index.md already exists."
          fi

      - name: Read and Parse index.md
        id: parse_markdown
        run: |
          HTML_LIST=""
          while IFS= read -r line; do
            if [[ "$line" =~ ^- ]]; then # Check if line starts with '-' (list item)
              IFS='-[]()' read -r -a parts <<< "$line"
              tool_title="${parts[2]}" # Tool title is in the second part after split
              tool_url="${parts[3]}"   # URL is in the third part after split
              tool_description="${parts[4]}" # Description is in the fourth part after split (after ' - ')

              if [[ -n "$tool_title" && -n "$tool_url" ]]; then # Ensure title and URL are not empty
                tool_title=$(echo "$tool_title" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//') # Trim whitespace
                tool_url=$(echo "$tool_url" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')     # Trim whitespace
                tool_description=$(echo "$tool_description" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//') # Trim whitespace

                HTML_LIST+="<li><a href=\"./$tool_url\">$tool_title</a> - $tool_description</li>"
              fi
            fi
          done < index.md
          echo "html_list_output<<EOF" >> "$GITHUB_OUTPUT"
          echo "$HTML_LIST" >> "$GITHUB_OUTPUT"
          echo "EOF" >> "$GITHUB_OUTPUT"
          echo "Generated HTML List (for debug):"
          echo "$HTML_LIST"

      - name: Update index.html with Tool List
        run: |
          HTML_LIST="${{ steps.parse_markdown.outputs.html_list_output }}"
          sed -i "s|<!-- TOOL_LIST_MARKDOWN_HERE -->|$HTML_LIST|" index.html

      - name: Update index.html title
        run: |
          sed -i "s|<title>CODEV.ID.*</title>|<title>Tools</title>|" index.html

      - name: Commit and Push changes
        uses: actions/checkout@v3
        with:
          ref: main
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Commit and Push updated index.html
        run: |
          git config --local user.email "actions@github.com"
          git config --local user.name "GitHub Actions Bot"
          git add index.html index.md # Add index.md to commit as well
          git commit -m "feat: Update tools index.html from index.md"
          git push origin main
