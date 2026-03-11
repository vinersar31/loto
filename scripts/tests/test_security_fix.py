import json
import os
import unittest
from unittest.mock import patch
import logging
from io import StringIO
import sys

# Mock requests and bs4 before importing scrape_results
from unittest.mock import MagicMock
sys.modules["requests"] = MagicMock()
sys.modules["bs4"] = MagicMock()

# Add the scripts directory to the path so we can import scrape_results
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import scrape_results

class TestScrapeResultsSecurity(unittest.TestCase):
    def test_update_results_file_invalid_json_logging(self):
        # Setup a temporary file with invalid JSON
        data_file = "./test_results.json"
        with open(data_file, 'w') as f:
            f.write("invalid json content {")

        latest_date = "01-01-2023"
        latest_649 = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5, 6]}
        latest_joker = {"date": "01-01-2023", "numbers": [1, 2, 3, 4, 5], "joker": 6}

        # Capture logging
        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        logger = logging.getLogger()
        logger.addHandler(handler)

        try:
            # Run the update
            scrape_results.update_results_file(latest_date, latest_649, latest_joker, data_file=data_file)

            # Verify the file was overwritten correctly
            with open(data_file, 'r') as f:
                data = json.load(f)

            self.assertEqual(len(data["loto649"]), 1)
            self.assertEqual(data["loto649"][0], latest_649)

            # Verify that an error was logged
            log_output = log_stream.getvalue()
            self.assertIn("Error reading existing data", log_output)
            self.assertIn("Expecting value", log_output) # Specific to JSONDecodeError

        finally:
            # Cleanup
            logger.removeHandler(handler)
            if os.path.exists(data_file):
                os.remove(data_file)

if __name__ == '__main__':
    unittest.main()
