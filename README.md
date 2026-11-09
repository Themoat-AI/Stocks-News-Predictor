# Market Signal — Stocks News Predictor

A news-impact dashboard with a transparent headline scoring heuristic, a Streamlit app, and a Manifest V3 Chromium browser extension.

## Deploy on Streamlit Community Cloud

1. Push this repository to GitHub (the Streamlit app entrypoint is `streamlit_app.py`).
2. In [Streamlit Community Cloud](https://share.streamlit.io/), select **Create app**, choose this repository and branch, and set **Main file path** to `streamlit_app.py`.
3. Deploy. The app starts with illustrative demo headlines; no API key is required to try it.
4. For current news, create a free [Finnhub](https://finnhub.io/register) token. Enter it in the app sidebar, or add it in the Streamlit app's **Settings → Secrets** as:

   ```toml
   FINNHUB_API_KEY = "your-finnhub-token"
   ```

   The app uses the token only to request Finnhub's general-news endpoint. `requirements.txt` contains the Python dependencies installed by Streamlit Cloud.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
streamlit run streamlit_app.py
```

You can enter a Finnhub token in the sidebar, or set `FINNHUB_API_KEY` in `.streamlit/secrets.toml` to use it by default. Never commit real API keys to GitHub.

## Browser extension (Chrome / Edge)

1. Download this repository as a ZIP and extract it.
2. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` folder.
4. Enter a Finnhub token in the extension to load current general headlines, or use the demo headlines.

To distribute a ZIP for Chromium-based browsers, zip the contents of `extension/` so `manifest.json` is at the ZIP root. A signed Chrome Web Store package is not published by this repository.

## Scoring and limitations

Each headline receives an **impact score (0–100)** based on market relevance (34%), catalyst terms (30%), language strength (25%), and recency (11%), plus a **direction score (−100 to +100)** derived from a positive/negative keyword balance. Scores at or above +18 are bullish, at or below −18 bearish, and otherwise neutral.

These are explainable text heuristics—not a trained forecasting model or verified predictions of stock-price movement. They can miss context, irony, company-specific implications, and breaking developments. They are for informational/educational use only, not investment advice.

## Project files

- `streamlit_app.py`: Streamlit deployment entrypoint.
- `requirements.txt`: Python app dependencies.
- `index.html`, `styles.css`, `app.js`: static web dashboard.
- `scoring.js`: JavaScript scoring functions shared with the extension.
- `extension/`: Manifest V3 browser extension.
