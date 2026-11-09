from __future__ import annotations

import math
import os
from datetime import datetime, timezone
from typing import Any

import requests
import streamlit as st

st.set_page_config(
    page_title="Market Signal — News Impact",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

POSITIVE_TERMS = [
    "beats", "beat", "surge", "surges", "rally", "raises", "raised", "upgrade",
    "upgraded", "growth", "profit", "profits", "record", "approval", "approved",
    "strong", "bullish", "buyback", "dividend", "outperform", "deal", "acquisition",
    "expands", "expansion", "positive", "partnership", "wins", "rebound",
]
NEGATIVE_TERMS = [
    "misses", "miss", "plunge", "plunges", "crash", "cuts forecast", "cuts outlook",
    "downgrade", "downgraded", "loss", "losses", "layoffs", "lawsuit", "investigation",
    "recall", "warning", "weak", "bearish", "default", "bankruptcy", "fraud", "decline",
    "declines", "falls", "fell", "below expectations", "fine", "penalty", "sanctions",
    "disappoints", "disappointing",
]
MARKET_TERMS = [
    "stock", "shares", "market", "investor", "earnings", "revenue", "profit", "guidance",
    "forecast", "federal reserve", "fed", "interest rate", "inflation", "jobs report", "gdp",
    "merger", "acquisition", "ipo", "sec", "nasdaq", "s&p", "dow", "bond", "treasury",
    "oil", "bank", "company", "ceo", "quarter", "dividend", "analyst", "regulator",
]
CATALYST_TERMS = [
    "earnings", "revenue", "guidance", "forecast", "federal reserve", "interest rate",
    "inflation", "jobs report", "gdp", "merger", "acquisition", "ipo", "approval", "lawsuit",
    "investigation", "recall", "bankruptcy", "default", "layoffs", "buyback", "dividend",
    "contract", "sanctions", "regulator", "sec", "quarterly results", "cuts outlook", "raises outlook",
]
INTENSIFIER_TERMS = [
    "surprise", "unexpected", "record", "massive", "halt", "emergency", "breaking", "soars",
    "plunges", "slashed", "all-time", "historic", "first time", "billions", "billion",
]

DEMO_STORIES = [
    {"headline": "Federal Reserve signals interest rates may stay higher for longer", "summary": "Investors reassess rate expectations after policymakers emphasize persistent inflation risks.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 1800, "url": "https://www.federalreserve.gov/"},
    {"headline": "Chipmaker raises full-year revenue forecast on strong AI demand", "summary": "The company reported broad customer growth and said its next-quarter outlook exceeds analyst expectations.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 3600, "url": "https://www.sec.gov/"},
    {"headline": "Major retailer misses earnings estimates and cuts outlook", "summary": "Weak consumer spending and higher costs pressured quarterly profits; shares fell in after-hours trading.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 7200, "url": "https://www.sec.gov/"},
    {"headline": "Oil prices rise as supply disruption concerns return", "summary": "Energy markets weigh new supply risks alongside the latest global demand forecasts.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 10800, "url": "https://www.eia.gov/"},
    {"headline": "Regulator opens investigation into major bank lending practices", "summary": "The review may lead to penalties and increased compliance costs, the bank disclosed.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 16000, "url": "https://www.sec.gov/"},
    {"headline": "Biotech firm wins approval for new treatment after clinical trial success", "summary": "The regulator approved the therapy, creating a potential new growth opportunity for the company.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 22000, "url": "https://www.fda.gov/"},
    {"headline": "U.S. jobs report shows steady hiring and moderate wage growth", "summary": "The latest economic data may influence investor expectations for the Federal Reserve.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 30000, "url": "https://www.bls.gov/"},
    {"headline": "Automaker announces large-scale layoffs amid declining demand", "summary": "The company said it will cut costs after weaker sales and a revised production forecast.", "source": "Market Desk", "datetime": int(datetime.now(timezone.utc).timestamp()) - 40000, "url": "https://www.sec.gov/"},
]


def count_terms(text: str, terms: list[str]) -> int:
    return sum(term in text for term in terms)


def score_story(item: dict[str, Any]) -> dict[str, Any]:
    headline = str(item.get("headline") or item.get("title") or "Untitled story").strip()
    summary = str(item.get("summary") or item.get("description") or "")
    text = f"{headline}. {summary}".lower()
    raw_sentiment = count_terms(text, POSITIVE_TERMS) - count_terms(text, NEGATIVE_TERMS)
    sentiment = round(100 * math.tanh(raw_sentiment * 0.6))
    relevance_count = count_terms(text, MARKET_TERMS)
    catalyst_count = count_terms(text, CATALYST_TERMS)
    intensity_count = count_terms(text, INTENSIFIER_TERMS)
    relevance = min(1.0, 0.25 + relevance_count * 0.12)
    catalyst = min(1.0, catalyst_count * 0.28)
    language_strength = min(1.0, abs(raw_sentiment) * 0.22 + intensity_count * 0.18 + catalyst_count * 0.13)

    published = item.get("datetime") or item.get("publishedAt") or item.get("seendate")
    try:
        if isinstance(published, (int, float)) or str(published).isdigit():
            published_at = datetime.fromtimestamp(float(published), tz=timezone.utc)
        else:
            published_at = datetime.fromisoformat(str(published).replace("Z", "+00:00"))
            if published_at.tzinfo is None:
                published_at = published_at.replace(tzinfo=timezone.utc)
        age_hours = max(0.0, (datetime.now(timezone.utc) - published_at).total_seconds() / 3600)
    except (ValueError, TypeError, OverflowError, OSError):
        age_hours = 24.0

    recency = max(0.0, math.exp(-age_hours / 48))
    impact = round(100 * min(1.0, relevance * 0.34 + catalyst * 0.30 + language_strength * 0.25 + recency * 0.11))
    direction = "bullish" if sentiment >= 18 else "bearish" if sentiment <= -18 else "neutral"
    return {**item, "headline": headline, "summary": summary, "sentiment": sentiment, "impact": impact, "direction": direction, "age_hours": age_hours}


def get_secret_token() -> str:
    try:
        return str(st.secrets.get("FINNHUB_API_KEY", ""))
    except Exception:
        return os.environ.get("FINNHUB_API_KEY", "")


def fetch_headlines(token: str) -> list[dict[str, Any]]:
    response = requests.get(
        "https://finnhub.io/api/v1/news",
        params={"category": "general", "token": token},
        timeout=20,
    )
    if response.status_code == 401:
        raise ValueError("Finnhub rejected that token. Check it and try again.")
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list) or not data:
        raise ValueError("Finnhub returned no headlines. Try again later or use demo mode.")
    return data


def age_label(hours: float) -> str:
    if hours < 1:
        return f"{max(1, round(hours * 60))}m ago"
    if hours < 24:
        return f"{round(hours)}h ago"
    return f"{int(hours // 24)}d ago"


st.markdown("""
<style>
:root { color-scheme: dark; }
[data-testid="stAppViewContainer"] { background: radial-gradient(ellipse at 68% -12%, #18304b 0, transparent 42%), #0b111a; }
[data-testid="stHeader"] { background: transparent; }
.block-container { max-width: 1120px; padding-top: 2rem; }
[data-testid="stMetric"] { background:#101923; border:1px solid #263442; padding:16px; border-radius:10px; }
[data-testid="stMetricLabel"] { color:#91a0b2; }
.story-card { background:linear-gradient(110deg,#111b26,#101721); border:1px solid #263442; border-radius:10px; padding:17px 19px; margin:9px 0; }
.story-title { color:#edf3f8; font-size:1.04rem; font-weight:650; text-decoration:none; }
.story-title:hover { color:#72dabb; }
.story-meta { color:#91a0b2; font-size:.78rem; margin-bottom:6px; }
.story-summary { color:#a0adbb; font-size:.88rem; margin:.4rem 0; }
.impact { font-size:1.9rem; font-weight:750; color:#64ddb5; line-height:1.1; }
.impact.bearish { color:#ff7182; } .impact.neutral { color:#bac6d0; }
.direction { text-transform:uppercase; font-weight:700; font-size:.72rem; letter-spacing:.06em; }
.disclaimer { color:#91a0b2; font-size:.82rem; border:1px solid #263442; padding:14px; border-radius:9px; }
</style>
""", unsafe_allow_html=True)

st.title("📈 Market Signal")
st.markdown("#### Know what’s moving the market.")
st.write("Rank financial headlines by estimated market impact, with a transparent direction signal.")

with st.sidebar:
    st.header("News feed")
    default_token = get_secret_token()
    token = st.text_input("Finnhub API token", value=default_token, type="password", help="Optional. Stored for this session only unless supplied through Streamlit secrets.")
    load_clicked = st.button("Load current headlines", type="primary", use_container_width=True)
    demo_clicked = st.button("Use demo headlines", use_container_width=True)
    st.caption("Get a free token at finnhub.io. The token is sent to Finnhub only to request news.")
    st.divider()
    st.caption("Impact combines market relevance (34%), catalyst terms (30%), language strength (25%), and recency (11%).")

if "stories" not in st.session_state:
    st.session_state.stories = [score_story(item) for item in DEMO_STORIES]
    st.session_state.feed_label = "Demo headlines · illustrative only"

if demo_clicked:
    st.session_state.stories = [score_story(item) for item in DEMO_STORIES]
    st.session_state.feed_label = "Demo headlines · illustrative only"

if load_clicked:
    if not token.strip():
        st.sidebar.error("Enter a Finnhub API token to load current headlines.")
    else:
        try:
            with st.spinner("Loading current headlines…"):
                st.session_state.stories = [score_story(item) for item in fetch_headlines(token.strip())]
                st.session_state.feed_label = "Finnhub · live headlines"
        except (requests.RequestException, ValueError) as exc:
            st.sidebar.error(str(exc))

stories = st.session_state.stories
ranked = sorted(stories, key=lambda story: story["impact"], reverse=True)
top = ranked[0] if ranked else None
st.caption(f"● {st.session_state.feed_label}")

if top:
    hero_left, hero_right = st.columns([3, 1])
    with hero_left:
        st.subheader("Top story signal")
        st.markdown(f"### {top['impact']} / 100 · {top['direction'].title()}")
        st.write(top["headline"])
    with hero_right:
        st.metric("Direction score", f"{top['sentiment']:+d}")

bullish_count = sum(story["direction"] == "bullish" for story in stories)
bearish_count = sum(story["direction"] == "bearish" for story in stories)
cols = st.columns(4)
cols[0].metric("Stories analyzed", len(stories))
cols[1].metric("High impact", sum(story["impact"] >= 65 for story in stories))
cols[2].metric("Bullish signals", bullish_count)
cols[3].metric("Bearish signals", bearish_count)

st.subheader("Top market stories")
filter_col, sort_col = st.columns([1, 1])
with filter_col:
    direction_filter = st.selectbox("Direction", ["All signals", "Bullish", "Bearish", "Neutral"])
with sort_col:
    sort_order = st.selectbox("Sort by", ["Highest impact", "Most recent"])
filtered = [story for story in stories if direction_filter == "All signals" or story["direction"] == direction_filter.lower()]
filtered.sort(key=(lambda story: story["age_hours"]) if sort_order == "Most recent" else (lambda story: -story["impact"]))

if not filtered:
    st.info("No stories match this filter.")
for story in filtered:
    signal_class = story["direction"]
    source = str(story.get("source") or "News source")
    published = age_label(story["age_hours"])
    url = str(story.get("url") or "")
    title_markup = f'<a class="story-title" href="{url}" target="_blank" rel="noopener noreferrer">{story["headline"]}</a>' if url.startswith(("https://", "http://")) else f'<span class="story-title">{story["headline"]}</span>'
    st.markdown(
        f'<article class="story-card"><div class="story-meta"><span class="direction">{signal_class}</span> &nbsp;·&nbsp; {source} &nbsp;·&nbsp; {published}</div>'
        f'<div class="impact {signal_class}">{story["impact"]}<span style="font-size:.75rem;color:#91a0b2"> / 100 impact</span></div>'
        f'<div style="margin:7px 0">{title_markup}</div>'
        f'<div class="story-summary">{story["summary"] or "No summary provided."}</div>'
        f'<div class="story-meta">Direction score: {story["sentiment"]:+d}</div></article>',
        unsafe_allow_html=True,
    )

st.markdown("---")
st.markdown("<div class='disclaimer'><strong>How to read this:</strong> Scores are explainable keyword-based heuristics, not a trained forecasting model or verified predictions of stock-price movement. They can miss context, irony, and company-specific implications. Demo headlines are illustrative. This tool is for educational purposes only and is not investment advice.</div>", unsafe_allow_html=True)
