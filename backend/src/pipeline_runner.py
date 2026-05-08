import json
import logging
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")

if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from src.pipeline import run_pipeline


def main():
    if len(sys.argv) < 3:
        raise SystemExit("Usage: python -m src.pipeline_runner <city> <drought_mode>")

    city = sys.argv[1]
    drought_mode = sys.argv[2].strip().lower()
    result = run_pipeline(city, drought_mode)

    print(json.dumps(result))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
