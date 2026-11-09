# Market Signal — Stocks News Predictor

A small browser-based dashboard that ranks general financial headlines using a transparent heuristic. It includes a Manifest V3 Chromium extension in `extension/`.

## Run the web app

Open `index.html` in a browser, or serve this folder with any static web server. The app starts with illustrative demo headlines. To load current headlines, create a free [Finnhub](https://finnhub.io/register) account, enter your API token, and select **Connect feed**. The browser stores the token locally; it is sent to Finnhub only when requesting its news endpoint.

## Install the browser extension (Chrome / Edge)

1. Download this repository as a ZIP and extract it, or clone the repository.
2. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
3. Choose **Load unpacked** and select the `extension/` folder.
4. Open the extension, enter a Finnhub API token to load current general headlines, or leave it blank to see demo headlines.

To distribute the extension as a ZIP, zip the contents of the `extension/` directory (the `manifest.json` file must be at the ZIP root). Chromium-based browsers can load the extracted extension directory in developer mode. This repository does not yet publish a signed Chrome Web Store package.

## How scoring works

Each headline is assigned:

- **Impact (0–100):** weighted combination of market relevance (34%), catalyst terms (30%), language strength (25%), and recency (11%).
- **Direction (−100 to +100):** a simple positive/negative keyword balance, normalized with a tanh curve; values at or above +18 are bullish, values at or below −18 bearish, and the rest neutral.

These are explainable text heuristics, not a trained forecasting model or verified predictions of stock-price movement. They can miss context, irony, company-specific implications, and breaking developments. They are for informational/educational use only—not investment advice. Demo headlines and their scores are illustrative, not live news.

## Project files

- `index.html`, `styles.css`, `app.js`: responsive dashboard.
- `scoring.js`: shared scoring functions.
- `extension/`: Manifest V3 popup extension.
