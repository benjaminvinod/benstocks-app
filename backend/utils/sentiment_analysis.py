# utils/sentiment_analysis.py

from transformers import pipeline

# Initialize the sentiment analysis model.
# This uses a lightweight, pre-trained model perfect for this task.
# The first time the server runs, it will download the model, which may take a moment.
print("Initializing sentiment analysis model...")
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
print("Sentiment analysis model initialized successfully.")

def analyze_sentiment(text: str) -> dict:
    """
    Analyzes the sentiment of a given text and returns the label and score.
    Example: {"label": "POSITIVE", "score": 0.99}
    """
    try:
        results = sentiment_pipeline(text)
        return results[0] # The pipeline returns a list with one dictionary
    except Exception as e:
        print(f"Error during sentiment analysis: {e}")
        return {"label": "NEUTRAL", "score": 0.5} # Fallback