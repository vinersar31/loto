import json
import sys
import os
import pytest
from unittest.mock import patch, mock_open

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import scrape_results

VALID_HTML = """
<html>
<body>
    <table>
        <tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
        <tr><td>10</td><td>20</td><td>30</td><td>40</td><td>50</td><td>60</td></tr>
    </table>
    <table>
        <tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>N JOCKER</th></tr>
        <tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr>
    </table>
    <table>
        <tr><th>DATA EXTRAGERII</th></tr>
        <tr><td>01-01-2023</td></tr>
    </table>
</body>
</html>
"""

def test_fetch_and_parse_results_success():
    date, loto649, joker = scrape_results.fetch_and_parse_results(VALID_HTML)

    assert date == "01-01-2023"
    assert loto649 == {
        "date": "01-01-2023",
        "numbers": [10, 20, 30, 40, 50, 60]
    }
    assert joker == {
        "date": "01-01-2023",
        "numbers": [1, 2, 3, 4, 5],
        "joker": 6
    }

def test_fetch_and_parse_results_missing_tables():
    empty_html = "<html><body></body></html>"
    date, loto649, joker = scrape_results.fetch_and_parse_results(empty_html)

    assert date == "Unknown Date"
    assert loto649 == {
        "date": "Unknown Date",
        "numbers": []
    }
    assert joker == {
        "date": "Unknown Date",
        "numbers": [],
        "joker": None
    }

def test_fetch_and_parse_results_partial_tables():
    partial_html = """
    <html>
    <body>
        <table>
            <tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
            <tr><td>10</td><td>20</td><td>30</td><td>40</td><td>50</td><td>60</td></tr>
        </table>
        <!-- Missing Joker and Date -->
    </body>
    </html>
    """
    date, loto649, joker = scrape_results.fetch_and_parse_results(partial_html)

    assert date == "Unknown Date"
    assert loto649 == {
        "date": "Unknown Date",
        "numbers": [10, 20, 30, 40, 50, 60]
    }
    assert joker == {
        "date": "Unknown Date",
        "numbers": [],
        "joker": None
    }

def test_update_results_file_new_data(tmp_path):
    data_file = tmp_path / "results.json"

    latest_date = "01-01-2023"
    latest_649 = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5, 6]}
    latest_joker = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5], "joker": 6}

    scrape_results.update_results_file(latest_date, latest_649, latest_joker, data_file=str(data_file))

    assert data_file.exists()

    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    assert len(data["loto649"]) == 1
    assert data["loto649"][0] == latest_649
    assert len(data["joker"]) == 1
    assert data["joker"][0] == latest_joker

def test_update_results_file_duplicate_date(tmp_path):
    data_file = tmp_path / "results.json"

    # Pre-populate
    existing_data = {
        "loto649": [{"date": "01-01-2023", "numbers": [10, 20, 30, 40, 50, 60]}],
        "joker": [{"date": "01-01-2023", "numbers": [10, 20, 30, 40, 50], "joker": 10}]
    }
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f)

    latest_date = "01-01-2023"
    latest_649 = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5, 6]}
    latest_joker = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5], "joker": 6}

    # Since date is same, it should NOT add the new ones, keeping existing
    scrape_results.update_results_file(latest_date, latest_649, latest_joker, data_file=str(data_file))

    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    assert len(data["loto649"]) == 1
    assert data["loto649"][0]["numbers"] == [10, 20, 30, 40, 50, 60]

def test_update_results_file_invalid_json(tmp_path):
    data_file = tmp_path / "results.json"

    # Write invalid json
    with open(data_file, 'w', encoding='utf-8') as f:
        f.write("invalid json content {")

    latest_date = "01-01-2023"
    latest_649 = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5, 6]}
    latest_joker = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5], "joker": 6}

    # Should recover gracefully and overwrite
    scrape_results.update_results_file(latest_date, latest_649, latest_joker, data_file=str(data_file))

    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    assert len(data["loto649"]) == 1
    assert data["loto649"][0] == latest_649
