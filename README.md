# CX Imperatives 2026 – Interactive Data Explorer

An interactive, client-side web application for exploring the **Merkle CX Imperatives 2026** consumer survey dataset. Built with Apache ECharts for rich, interactive visualizations.

## Live Demo

Once deployed: `https://<your-github-username>.github.io/<repo-name>/`

---

## Features

- **34 survey questions** across 4 topic sections
- **5 chart types**: Horizontal Bar, Vertical Bar, Radar, Heatmap, Pie/Donut
- **Cross-tab filtering** by 19 Brand Categories and 8 Brand Sectors
- **Activity selector** for multi-activity questions (Q13, Q14, Q15)
- **Export**: Download charts as PNG, download data as CSV
- **Responsive**: Works on desktop, tablet, and mobile
- Powered by [Apache ECharts](https://echarts.apache.org/) (Apache 2.0 license)

---

## Project Structure

```
.
├── docs/                     # Static web app (served by GitHub Pages)
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── config.js         # ECharts theme & constants
│   │   ├── data-utils.js     # Data filtering & formatting helpers
│   │   ├── charts.js         # ECharts option builders
│   │   └── app.js            # Main app logic & state
│   └── data/
│       └── survey-data.json  # Pre-processed survey dataset
├── scripts/
│   └── process-data.py       # Excel → JSON data processor
├── start-server.bat          # Local dev server (Windows)
├── .gitignore
└── README.md
```

---

## Local Development

### Prerequisites
- Python 3.10+
- `openpyxl` package: `pip install openpyxl`

### Run Locally

```bash
# 1. Process the Excel source data (requires the .xlsx file)
python scripts/process-data.py

# 2. Start a local web server
cd docs
python -m http.server 8080

# 3. Open in browser
# http://localhost:8080
```

Or on Windows, double-click `start-server.bat`.

---

## Re-generating Survey Data

Place the source Excel file in the repo root or at `scripts/data/`:
```
989-25 CX Imperatives 2026 - Survey Data Tables (Topline).xlsx
```

Then run:
```bash
python scripts/process-data.py
```

This overwrites `docs/data/survey-data.json`. Commit the updated JSON to deploy changes.

---

## GitHub Pages Deployment

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select:
   - Branch: `main` (or your default branch)
   - Folder: `/docs`
4. Click **Save**
5. Your app will be live at `https://<username>.github.io/<repo>/`

> **Note**: The Excel source file is excluded from the repo via `.gitignore`.
> The pre-processed `docs/data/survey-data.json` must be committed.

---

## Technology Stack

| Tool | License | Purpose |
|------|---------|---------|
| [Apache ECharts 5](https://echarts.apache.org/) | Apache 2.0 | Charts (bar, radar, heatmap, pie) |
| [Inter Font](https://fonts.google.com/specimen/Inter) | SIL OFL | Typography |
| Vanilla HTML/CSS/JS | – | No build step required |

---

## Data Source

**Merkle CX Imperatives 2026** consumer survey  
- n = 2,500 respondents  
- 30 countries  
- Fielded: 2025  
- Publisher: Merkle / dentsu
