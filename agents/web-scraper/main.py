"""Web Scraper Agent

Polls the devpigh dashboard for tasks and scrapes web pages.

Task input schema:
    {
        "url": "https://example.com",
        "selector": "optional CSS selector"   # optional
    }

Task result schema (no selector):
    {
        "url": "https://example.com",
        "title": "Page Title",
        "content": "full visible text of the page",
        "selector_used": null,
        "content_length": 1234,
        "fetched_at": "2026-03-20T12:00:00.000000"
    }

Task result schema (with selector):
    {
        "url": "https://news.ycombinator.com",
        "title": "Hacker News",
        "content": ["Headline one", "Headline two", ...],
        "selector_used": ".titleline > a",
        "content_length": 512,
        "fetched_at": "2026-03-20T12:00:00.000000"
    }
"""
import logging
import os
import threading
# import certifi
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests
from bs4 import BeautifulSoup

from devpigh_agent import DevpighAgent

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, *args):
        pass


class WebScraperAgent(DevpighAgent):
    def process_task(self, task: dict) -> dict:
        task_input = task["input"]
        url: str = task_input.get("url", "").strip()
        if not url:
            raise ValueError("task.input must contain a non-empty 'url' field")

        selector: str | None = task_input.get("selector") or None

        logger.info("Fetching %s (selector=%r)", url, selector)

        resp = requests.get(
            url,
            timeout=15,
            headers={"User-Agent": _USER_AGENT},
            verify=False  # Disable SSL verification to avoid issues with sites that have misconfigured certs
        )
        resp.raise_for_status()

        fetched_at = datetime.now(timezone.utc).isoformat()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Always extract the page title
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else ""

        if selector:
            elements = soup.select(selector)
            content = [el.get_text(strip=True) for el in elements]
            content_length = sum(len(s) for s in content)
            logger.info(
                "Selector %r matched %d element(s) (%d chars total)",
                selector,
                len(elements),
                content_length,
            )
        else:
            # Remove non-visible tags before extracting text
            for tag in soup(["script", "style", "nav", "footer", "head"]):
                tag.decompose()
            content = soup.get_text(separator=" ", strip=True)
            # Collapse runs of whitespace
            import re
            content = re.sub(r"\s{2,}", " ", content).strip()
            content_length = len(content)
            logger.info("Extracted %d chars of text from %s", content_length, url)

        return {
            "url": url,
            "title": title,
            "content": content,
            "selector_used": selector,
            "content_length": content_length,
            "fetched_at": fetched_at,
        }


if __name__ == "__main__":
    # Cloud Run requires an HTTP port to pass startup health checks
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("", port), HealthHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    agent = WebScraperAgent()
    agent.run()
