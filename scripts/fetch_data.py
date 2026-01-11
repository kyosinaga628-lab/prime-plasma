import requests
import json
from datetime import datetime, timedelta

def fetch_earthquake_data():
    # Define time range: 1 year ago to now
    end_time = datetime.now()
    start_time = end_time - timedelta(days=365)
    
    # Format dates to ISO 8601
    start_str = start_time.strftime('%Y-%m-%dT%H:%M:%S')
    end_str = end_time.strftime('%Y-%m-%dT%H:%M:%S')
    
    url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    
    # Japan bounding box (approximate)
    # minlat=20, maxlat=50, minlon=120, maxlon=155
    params = {
        "format": "geojson",
        "starttime": start_str,
        "endtime": end_str,
        "minlatitude": 20,
        "maxlatitude": 50,
        "minlongitude": 120,
        "maxlongitude": 155,
        "minmagnitude": 2.5,  # Lowered slightly to get more "dynamic" feeling data
        "orderby": "time"
    }
    
    print(f"Fetching data from USGS ({start_str} to {end_str})...")
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        count = data.get('metadata', {}).get('count', 0)
        print(f"Successfully fetched {count} earthquake events.")
        
        output_path = "data/earthquakes.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Data saved to {output_path}")
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    fetch_earthquake_data()
