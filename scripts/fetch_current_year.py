#!/usr/bin/env python3
"""
Fetch current year earthquake data for Japan region from USGS.
Used by GitHub Actions for daily updates.
"""
import requests
import json
from datetime import datetime
import os

def fetch_current_year_data():
    """現在の年の地震データを取得・更新"""
    now = datetime.now()
    year = now.year
    
    start_time = datetime(year, 1, 1, 0, 0, 0)
    end_time = now
    
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
        
        output_dir = "data"
        os.makedirs(output_dir, exist_ok=True)
        
        output_path = os.path.join(output_dir, f"earthquakes_{year}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  Saved to {output_path}")
        return count
        
    except requests.exceptions.RequestException as e:
        print(f"  Error fetching {year}: {e}")
        return 0

if __name__ == "__main__":
    fetch_current_year_data()
