import requests
from transformers import pipeline
import os
from dotenv import load_dotenv
load_dotenv()

# Load model once
classifier = pipeline("sentiment-analysis")

NEWS_API_KEY = os.getenv("NEWS_API_KEY")


def fetch_drought_news(city):
    if not NEWS_API_KEY:
        return []

    url = "https://newsapi.org/v2/everything"

    params = {
        "q": f"{city} drought water shortage heatwave",
        "apiKey": NEWS_API_KEY,
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": 5
    }

    try:
        res = requests.get(url, params=params).json()
        articles = [
            (a.get("title", "") + " " + (a.get("description") or ""))
            for a in res.get("articles", [])
        ]
        return articles
    except Exception as e:
        print("News fetch error:", e)
        return []


def compute_news_drought_score(articles):
    if not articles:
        return 0.5  # neutral

    scores = []

    for text in articles:
        try:
            result = classifier(text[:512])[0]

            if result["label"] == "NEGATIVE":
                scores.append(result["score"])
            else:
                scores.append(1 - result["score"])
        except:
            scores.append(0.5)

    return sum(scores) / len(scores)