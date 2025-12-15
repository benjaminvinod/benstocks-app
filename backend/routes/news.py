# backend/routes/news.py

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from newsdataapi import NewsDataApiClient
from config import NEWSDATA_API_KEY
from utils.sentiment_analysis import analyze_sentiment

router = APIRouter()

# Initialize the NewsData.io client
api = NewsDataApiClient(apikey=NEWSDATA_API_KEY)

@router.get("")
async def get_financial_news(query: Optional[str] = Query(None)):
    """
    Fetches the latest financial news.
    If 'query' is provided (e.g., 'AAPL' or 'Reliance'), it fetches specific news.
    Otherwise, it fetches general market news.
    """
    if not NEWSDATA_API_KEY:
        raise HTTPException(status_code=500, detail="News API key is not configured on the server.")

    try:
        # Determine the search query
        if query:
            # We add "stock" to the query to ensure we get financial results, not just general product news
            search_query = f'{query} AND (stock OR market OR finance)'
        else:
            # Default General Search
            search_query = 'stocks OR "mutual funds" OR ETFs OR "corporate bonds" OR finance OR investing'

        # Fetch from API
        response = api.news_api(
            q=search_query,
            language="en",
            category="business",
            size=10 
        )
        
        articles = response.get("results", [])
        
        processed_news = []
        seen_titles = set()

        for article in articles:
            title = article.get("title")
            link = article.get("link")
            pubDate = article.get("pubDate")
            source_id = article.get("source_id")
            
            # Filter out duplicates or empty titles
            if title and link and "No title" not in title and title not in seen_titles:
                sentiment = analyze_sentiment(title)
                processed_news.append({
                    "title": title,
                    "link": link,
                    "pubDate": pubDate,
                    "source": source_id,
                    "sentiment": sentiment.get("label", "NEUTRAL").upper(),
                    "sentiment_score": sentiment.get("score", 0.5)
                })
                seen_titles.add(title)
        
        return processed_news[:10]

    except Exception as e:
        print(f"Error fetching or processing news: {e}")
        # Return empty list instead of crashing, so the UI can handle it gracefully
        return []