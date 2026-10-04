# Slide diagrams (English)

Source is `*.mmd` (Mermaid). `*.png` and `*.svg` are rendered from it. Facts: code of 2026-10-02.

| File | Shows |
|---|---|
| `01-system-context` | Level 1: five user roles, metang, four CMU services |
| `02-containers` | Level 2, reference production setup: reverse proxy, web app + API, scheduled jobs, database, slip storage, outside services |
| `03-loan-status-map` | Every loan status and the moves between them |
| `04-journey-approval` | Request and approval, by role, with the LINE messages |
| `05-journey-repayment` | Transfer, receipt, installments, and the reminder emails |

Re-render after you edit a `.mmd` file (needs Chromium at `/usr/bin/chromium`):

```bash
npx -y -p @mermaid-js/mermaid-cli mmdc -i 02-containers.mmd -o 02-containers.png -s 2 -b white -C fonts.css -p puppeteer.json
```

`fonts.css` forces Liberation Sans. Without it the labels fall back to a serif font and the boxes clip the text.
