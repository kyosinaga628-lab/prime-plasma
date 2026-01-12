# Sismic JP - Dynamic Earthquake Visualization

A dynamic, interactive visualization of earthquake activity around Japan. This project visualizes seismic events with time-series animations, audio feedback, and an extensive data archive ranging from 2011 to the present.

## Features
- 🗺️ **Interactive Light Map**: Clean, high-contrast visualization using CartoDB Positron tiles.
- ⏱️ **Time-Series Animation**: Watch earthquakes occur chronologically with play/pause controls and a seek slider.
- 📅 **Data Archive (2011-2025)**: Explore historical seismic data year by year, including major events like the 2011 Tohoku earthquake.
- 🔴 **Visual Magnitude**: Circle size and color represent earthquake magnitude (size scales exponentially).
- 🔊 **Audio Feedback**: Generates sound for each quake—pitch and volume are dynamically modulated by magnitude.
- ⚡ **Auto-Updates**: Data is fetched automatically via GitHub Actions (Mon/Thu).

## Live Demo
**[https://kyosinaga628-lab.github.io/prime-plasma/](https://kyosinaga628-lab.github.io/prime-plasma/)**

## Local Development

1. **Install Dependencies**
   ```bash
   pip install requests
   ```

2. **Fetch Data**
   ```bash
   # Fetch latest year data
   python scripts/fetch_data.py
   
   # Fetch historical archive data (2011-2025)
   python scripts/fetch_archive_data.py
   ```

3. **Run Dev Server**
   ```bash
   python -m http.server 8080
   # Open http://localhost:8080
   ```

## Data Source
[USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/)

---

# Sismic JP - 日本列島地震活動ビジュアライゼーション

日本周辺の地震活動を動的に可視化するWebアプリケーションです。時系列アニメーション、音声フィードバック、および2011年から現在までのアーカイブデータ閲覧機能を備えています。

## 主な機能
- 🗺️ **インタラクティブ・マップ**: CartoDB Positronを使用した視認性の高いライトテーマの地図。
- ⏱️ **時系列アニメーション**: 再生/一時停止、スライダー操作で地震の発生を時系列で確認できます。
- 📅 **データアーカイブ (2011-2025)**: 2011年の東日本大震災など、過去の地震データを年ごとにタブで切り替えて閲覧可能。
- 🔴 **マグニチュード表現**: 地震の規模に応じて円の大きさ（指数関数的スケール）と色が変化します。
- 🔊 **音声フィードバック**: 地震発生時に音が鳴ります。マグニチュードが大きいほど「低く」「大きい」音が生成されます。
- ⚡ **自動更新**: GitHub Actionsにより、週2回（月・木）最新データを自動取得します。

## デモサイト
**[https://kyosinaga628-lab.github.io/prime-plasma/](https://kyosinaga628-lab.github.io/prime-plasma/)**

## ローカル開発環境のセットアップ

1. **依存ライブラリのインストール**
   ```bash
   pip install requests
   ```

2. **データの取得**
   ```bash
   # 直近1年分のデータを取得
   python scripts/fetch_data.py
   
   # 2011年〜2025年のアーカイブデータを取得
   python scripts/fetch_archive_data.py
   ```

3. **開発サーバーの起動**
   ```bash
   python -m http.server 8080
   # ブラウザで http://localhost:8080 を開く
   ```

## データソース
[USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/)
