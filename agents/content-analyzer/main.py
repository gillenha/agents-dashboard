"""Content Analyzer Agent

Polls the devpigh dashboard for tasks and analyzes text using Claude.

Task input schema:
    {
        "text": "some text to analyze",
        "instruction": "summarize this"
    }

Task result schema:
    {
        "instruction": "the original instruction",
        "input_length": 123,
        "response": "Claude's response text",
        "response_length": 456,
        "model": "claude-sonnet-4-20250514",
        "usage": { "input_tokens": N, "output_tokens": N }
    }
"""
import logging
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import anthropic

from devpigh_agent import DevpighAgent

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)

_MODEL = "claude-sonnet-4-20250514"


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, *args):
        pass


class ContentAnalyzerAgent(DevpighAgent):
    def __init__(self) -> None:
        super().__init__()
        self._anthropic = anthropic.Anthropic(
            api_key=os.environ["ANTHROPIC_API_KEY"]
        )

    def process_task(self, task: dict) -> dict:
        task_input = task["input"]
        text: str = task_input.get("text", "").strip()
        instruction: str = task_input.get("instruction", "").strip()

        if not text:
            raise ValueError("task.input must contain a non-empty 'text' field")
        if not instruction:
            raise ValueError("task.input must contain a non-empty 'instruction' field")

        logger.info(
            "Analyzing %d chars with instruction: %.80s", len(text), instruction
        )

        response = self._anthropic.messages.create(
            model=_MODEL,
            max_tokens=4096,
            system="You are a helpful assistant. Follow the user's instruction precisely.",
            messages=[
                {"role": "user", "content": f"{instruction}\n\n---\n\n{text}"}
            ],
        )

        response_text = next(b.text for b in response.content if b.type == "text")

        logger.info(
            "Response: %d chars (%d input / %d output tokens)",
            len(response_text),
            response.usage.input_tokens,
            response.usage.output_tokens,
        )

        return {
            "instruction": instruction,
            "input_length": len(text),
            "response": response_text,
            "response_length": len(response_text),
            "model": response.model,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        }


if __name__ == "__main__":
    # Cloud Run requires an HTTP port to pass startup health checks
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("", port), HealthHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    agent = ContentAnalyzerAgent()
    agent.run()
