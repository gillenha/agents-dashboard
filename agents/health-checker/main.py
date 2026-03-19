"""Health Checker Agent

Polls the devpigh dashboard for tasks and performs HTTP health checks.

Task input schema:
    { "urls": ["https://example.com", "https://api.example.com/health", ...] }

Task result schema:
    {
        "results": [
            {
                "url": "https://example.com",
                "status_code": 200,       # int or null on connection error
                "response_time_ms": 123,
                "healthy": true,          # true = 2xx response
                "error": null             # only present on connection error
            },
            ...
        ]
    }
"""
import logging
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests
from requests.exceptions import ConnectionError as RequestsConnectionError
from requests.exceptions import Timeout

from devpigh_agent import DevpighAgent

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, *args):
        pass


class HealthCheckerAgent(DevpighAgent):
    def process_task(self, task: dict) -> dict:
        urls: list[str] = task["input"].get("urls", [])
        if not urls:
            raise ValueError("task.input must contain a non-empty 'urls' list")

        logger.info("Checking %d URL(s)", len(urls))
        results = []
        for url in urls:
            result = self._check_url(url)
            status_label = "healthy" if result["healthy"] else "unhealthy"
            logger.info(
                "  %-60s  %s  %s  %dms",
                url,
                result["status_code"] if result["status_code"] is not None else "ERR",
                status_label,
                result["response_time_ms"],
            )
            results.append(result)

        healthy_count = sum(1 for r in results if r["healthy"])
        logger.info("%d/%d URLs healthy", healthy_count, len(results))
        return {"results": results}

    def _check_url(self, url: str) -> dict:
        start = time.perf_counter()
        try:
            resp = requests.get(url, timeout=10, allow_redirects=True)
            elapsed_ms = round((time.perf_counter() - start) * 1000)
            return {
                "url": url,
                "status_code": resp.status_code,
                "response_time_ms": elapsed_ms,
                "healthy": 200 <= resp.status_code < 300,
            }
        except (RequestsConnectionError, Timeout) as exc:
            elapsed_ms = round((time.perf_counter() - start) * 1000)
            return {
                "url": url,
                "status_code": None,
                "response_time_ms": elapsed_ms,
                "healthy": False,
                "error": str(exc),
            }


if __name__ == "__main__":
    # Cloud Run requires an HTTP port to pass startup health checks
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("", port), HealthHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    agent = HealthCheckerAgent()
    agent.run()