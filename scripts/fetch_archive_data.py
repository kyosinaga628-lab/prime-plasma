import requests
import json
from datetime import datetime
import os
import time

def fetch_year_data(year):
    """指定された年の地震データを取得"""
    start_time = datetime(year, 1, 1, 0, 0, 0)
    end_time = datetime(year, 12, 31, 23, 59, 59)
    
    # 現在の年の場合は今日までに制限
    now = datetime.now()
    if year == now.year:
        end_time = now
    
    # 未来の年はスキップ
    if start_time > now:
        return None
    
    start_str = start_time.strftime('%Y-%m-%dT%H:%M:%S')
    end_str = end_time.strftime('%Y-%m-%dT%H:%M:%S')
    
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    
    params = {
        "format": "geojson",
        "starttime": start_str,
        "endtime": end_str,
        "minlatitude": 20,
        "maxlatitude": 50,
        "minlongitude": 120,
        "maxlongitude": 155,
        "minmagnitude": 2.5,
        "orderby": "time"
    }
    
    print(f"Fetching {year} data ({start_str} to {end_str})...")
    
    try:
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        count = data.get('metadata', {}).get('count', 0)
        print(f"  -> {count} events found.")
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"  Error fetching {year}: {e}")
        return None

def main():
    output_dir = "data"
    os.makedirs(output_dir, exist_ok=True)
    
    start_year = 2011
    end_year = 2025
    
    print(f"Fetching earthquake archive data from {start_year} to {end_year}...")
    print("=" * 50)
    
    for year in range(start_year, end_year + 1):
        data = fetch_year_data(year)
        
        if data is not None:
            output_path = os.path.join(output_dir, f"earthquakes_{year}.json")
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  Saved to {output_path}")
        
        # APIレート制限を考慮して少し待機
        time.sleep(2)
    
    print("=" * 50)
    print("Archive data fetch complete!")

if __name__ == "__main__":
    main()
