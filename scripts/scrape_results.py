import requests
from bs4 import BeautifulSoup
import json
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

URL = "https://www.loto.ro"
DATA_FILE = "next-loto-app/public/data/results.json"

def fetch_and_parse_results(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    loto_649_draws = []
    joker_draws = []

    # We scrape all tables, find the ones matching 6/49, Joker headers, or Extraction Date
    tables = soup.find_all('table')
    dates = []

    for table in tables:
        rows = table.find_all('tr')
        if len(rows) < 2:
            continue

        header = [col.text.strip() for col in rows[0].find_all(['th', 'td'])]
        data = [col.text.strip() for col in rows[1].find_all(['th', 'td'])]

        if header == ['1', '2', '3', '4', '5', '6']:
            loto_649_draws.append(data)
        elif header == ['1', '2', '3', '4', '5', 'N JOCKER']:
            joker_draws.append(data)
        elif header == ['DATA EXTRAGERII'] and len(data) > 0:
            dates.append(data[0])

    # We assume the first date corresponds to the latest draws for both 6/49 and Joker
    # (they are extracted on the same day usually)
    latest_date = dates[0] if dates else "Unknown Date"

    # Format data
    latest_649 = {
        "date": latest_date,
        "numbers": [int(x) for x in loto_649_draws[0]] if len(loto_649_draws) > 0 else []
    }

    latest_joker = {
        "date": latest_date,
        "numbers": [int(x) for x in joker_draws[0][:5]] if len(joker_draws) > 0 else [],
        "joker": int(joker_draws[0][5]) if len(joker_draws) > 0 else None
    }

    return latest_date, latest_649, latest_joker

def update_results_file(latest_date, latest_649, latest_joker, data_file=DATA_FILE):
    # Load existing data
    os.makedirs(os.path.dirname(data_file), exist_ok=True)
    existing_data = {"loto649": [], "joker": []}
    if os.path.exists(data_file):
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            logging.error(f"Error reading existing data from {data_file}: {e}. Starting fresh.")

    # Check for duplicates by date
    if latest_649["numbers"] and (not existing_data["loto649"] or existing_data["loto649"][0]["date"] != latest_date):
        existing_data["loto649"].insert(0, latest_649)

    if latest_joker["numbers"] and (not existing_data["joker"] or existing_data["joker"][0]["date"] != latest_date):
        existing_data["joker"].insert(0, latest_joker)

    # Keep only last 100 draws for performance
    existing_data["loto649"] = existing_data["loto649"][:100]
    existing_data["joker"] = existing_data["joker"][:100]

    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=2)

def get_results():
    response = requests.get(URL, headers={'User-Agent': 'Mozilla/5.0'})
    latest_date, latest_649, latest_joker = fetch_and_parse_results(response.text)
    update_results_file(latest_date, latest_649, latest_joker)
    print(f"Updated data successfully. Latest date: {latest_date}")

if __name__ == "__main__":
    get_results()
