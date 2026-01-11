# Sismic JP - Earthquake Visualization

A dynamic visualization of earthquake activity in Japan over the past year.

## Features
- 🗺️ Dark-themed interactive map
- ⏱️ Time-series animation with slider
- 🔴 Magnitude-based color coding
- 🔊 Audio feedback (volume/pitch by magnitude)
- ⚡ Automatic data updates via GitHub Actions

## Live Demo
[View on GitHub Pages](https://YOUR_USERNAME.github.io/prime-plasma/)

## Local Development

1. **Fetch Data**
   ```bash
   pip install requests
   python scripts/fetch_data.py
   ```

2. **Run Dev Server**
   ```bash
   python -m http.server
   # Open http://localhost:8000
   ```

## Deployment (GitHub Pages)

1. Push to GitHub
2. Settings → Pages → Source: `main` / `/ (root)`
3. Data updates automatically every Mon/Thu via GitHub Actions

## Data Source
[USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/)
