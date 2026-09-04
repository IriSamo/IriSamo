name: Generate GitHub Stats

on:
  schedule:
    - cron: "0 3 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate-stats:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate stats.svg
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_USERNAME: irisamo
        run: node scripts/generate-stats.js

      - name: Commit stats
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

          git add dist/stats.svg

          if git diff --cached --quiet; then
            echo "No changes to commit"
            exit 0
          fi

          git commit -m "chore: update GitHub stats"
          git push
