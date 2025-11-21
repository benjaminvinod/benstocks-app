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
    and returns a structured list of unique news articles.
    """
    if not NEWSDATA_API_KEY:
        raise HTTPException(status_code=500, detail="News API key is not configured on the server.")

    try:
        # UPDATED QUERY: Removed quotes around single words to broaden search results.
        # Quotes like '"stocks"' force the API to look for the exact phrase including quotes, 
        # which drastically limits results.
        response = api.news_api(
            q='stocks OR "mutual funds" OR ETFs OR "corporate bonds" OR finance OR investing',
            language="en",
            category="business",
            size=10  # Explicitly request 10 articles
        )
        
        articles = response.get("results", [])
        
        processed_news = []
        seen_titles = set()

        for article in articles:
            title = article.get("title")
            link = article.get("link")
            
            # Filter out duplicates or empty titles
            if title and link and "No title" not in title and title not in seen_titles:
                sentiment = analyze_sentiment(title)
                processed_news.append({
                    "title": title,
                    "link": link,
                    "sentiment": sentiment.get("label", "NEUTRAL").upper(),
                    "sentiment_score": sentiment.get("score", 0.5)
                })
                seen_titles.add(title)
        
        return processed_news[:10]

    except Exception as e:
        print(f"Error fetching or processing news: {e}")
        raise HTTPException(status_code=503, detail="Could not fetch news at this time.")