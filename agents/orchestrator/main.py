"""Orchestrator Agent

Chains health-checker → web-scraper → content-analyzer in sequence.
Does no work itself — delegates every step via delegate_task().

Task input schema:
    {
        "url": "https://example.com",
        "instruction": "Summarize this page in 3 bullet points."
    }

Task result schema (all steps succeeded):
    {
        "url": "https://example.com",
        "instruction": "Summarize this page in 3 bullet points.",
        "steps": {
            "health_check": {
                "healthy": true,
                "status_code": 200,
                "response_time_ms": 87
            },
            "scrape": {
                "title": "Example Domain",
                "content_length": 1256,
                "fetched_at": "2026-03-20T12:00:00+00:00"
            },
            "analysis": {
                "response": "...",
                "model": "claude-sonnet-4-20250514",
                "usage": {"input_tokens": 312, "output_tokens": 128}
            }
        },
        "final_response": "Claude's analysis text"
    }

On partial failure the failing step will have an "error" key instead of its normal fields.
"""
import logging
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

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


class OrchestratorAgent(DevpighAgent):
    def process_task(self, task: dict) -> dict:
        task_input = task["input"]
        url: str = task_input.get("url", "").strip()
        instruction: str = task_input.get("instruction", "").strip()

        if not url:
            raise ValueError("task.input must contain a non-empty 'url' field")
        if not instruction:
            raise ValueError("task.input must contain a non-empty 'instruction' field")

        steps: dict = {}
        final_response: str | None = None

        # ── Step 1: Health check ───────────────────────────────────────────────
        logger.info("Step 1/3: health check for %s", url)
        try:
            hc_output = self.delegate_task(
                "health-checker", {"urls": [url]}, timeout=60
            )
            # Results is a list; pick the entry for our URL (only one was sent)
            results: list = hc_output.get("results", [])
            hc_result = next((r for r in results if r.get("url") == url), results[0] if results else {})
            steps["health_check"] = {
                "healthy": hc_result.get("healthy", False),
                "status_code": hc_result.get("status_code"),
                "response_time_ms": hc_result.get("response_time_ms"),
            }
            if hc_result.get("error"):
                steps["health_check"]["error"] = hc_result["error"]

            if not hc_result.get("healthy"):
                logger.info(
                    "Health check FAILED for %s (status=%s)",
                    url,
                    hc_result.get("status_code"),
                )
                return _build_result(url, instruction, steps, final_response)

            logger.info(
                "Health check passed for %s (%dms)",
                url,
                hc_result.get("response_time_ms", 0),
            )
        except Exception as exc:
            logger.error("Health check step failed: %s", exc)
            steps["health_check"] = {"error": str(exc)}
            return _build_result(url, instruction, steps, final_response)

        # ── Step 2: Scrape ─────────────────────────────────────────────────────
        logger.info("Step 2/3: scraping %s", url)
        scraped_content: str = ""
        try:
            scrape_output = self.delegate_task(
                "web-scraper", {"url": url}, timeout=60
            )
            content = scrape_output.get("content", "")
            # content is a string when no selector is used
            scraped_content = content if isinstance(content, str) else ""
            content_length: int = scrape_output.get("content_length", len(scraped_content))
            steps["scrape"] = {
                "title": scrape_output.get("title", ""),
                "content_length": content_length,
                "fetched_at": scrape_output.get("fetched_at", ""),
            }
            logger.info(
                "Scrape complete: %d chars from %s",
                content_length,
                url,
            )

            if content_length < 50:
                logger.warning(
                    "Scraped content too short (%d chars) — skipping analysis",
                    content_length,
                )
                return _build_result(url, instruction, steps, final_response)
        except Exception as exc:
            logger.error("Scrape step failed: %s", exc)
            steps["scrape"] = {"error": str(exc)}
            return _build_result(url, instruction, steps, final_response)

        # ── Step 3: Analyze ────────────────────────────────────────────────────
        logger.info("Step 3/3: analyzing content with instruction: %.80s", instruction)
        try:
            analysis_output = self.delegate_task(
                "content-analyzer",
                {"text": scraped_content, "instruction": instruction},
                timeout=120,
            )
            final_response = analysis_output.get("response", "")
            steps["analysis"] = {
                "response": final_response,
                "model": analysis_output.get("model", ""),
                "usage": analysis_output.get("usage", {}),
            }
            logger.info(
                "Analysis complete: %d chars response",
                len(final_response or ""),
            )
        except Exception as exc:
            logger.error("Analysis step failed: %s", exc)
            steps["analysis"] = {"error": str(exc)}

        return _build_result(url, instruction, steps, final_response)


def _build_result(
    url: str,
    instruction: str,
    steps: dict,
    final_response: str | None,
) -> dict:
    result: dict = {
        "url": url,
        "instruction": instruction,
        "steps": steps,
    }
    if final_response is not None:
        result["final_response"] = final_response
    return result


if __name__ == "__main__":
    # Cloud Run requires an HTTP port to pass startup health checks
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("", port), HealthHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    agent = OrchestratorAgent()
    agent.run()
