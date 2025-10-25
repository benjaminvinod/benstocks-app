# routes/news.py

from fastapi import APIRouter, HTTPException
from newsdataapi import NewsDataApiClient
from config import NEWSDATA_API_KEY
from utils.sentiment_analysis import analyze_sentiment

router = APIRouter()

# Initialize the NewsData.io client
api = NewsDataApiClient(apikey=NEWSDATA_API_KEY)

@router.get("")
async def get_financial_news():
    """
    Fetches the latest financial news, analyzes sentiment for each headline,
    and returns a structured list of news articles.
    """
    if not NEWSDATA_API_KEY:
        raise HTTPException(status_code=500, detail="News API key is not configured on the server.")

    try:
        # --- START: MODIFIED CODE ---
        # "economics" is not a valid category, so it has been removed.
        # We will now only search for the 'business' category.
        response = api.news_api(q="finance OR business", language="en", country="in", category="business")
        # --- END: MODIFIED CODE ---
        
        articles = response.get("results", [])
        
        processed_news = []
        for article in articles:
            title = article.get("title")
            link = article.get("link")
            
            if title and link and "No title" not in title:
                sentiment = analyze_sentiment(title)
                processed_news.append({
                    "title": title,
                    "link": link,
                    "sentiment": sentiment.get("label", "NEUTRAL").upper(),
                    "sentiment_score": sentiment.get("score", 0.5)
                })
        
        return processed_news[:10]

    except Exception as e:
        print(f"Error fetching or processing news: {e}")
        raise HTTPException(status_code=503, detail="Could not fetch news at this time.")