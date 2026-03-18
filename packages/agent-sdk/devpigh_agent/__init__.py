import logging

from .agent import DevpighAgent

__all__ = ["DevpighAgent"]

# Library-standard: add NullHandler so callers control logging output.
# Users who want the default format can call logging.basicConfig() before
# instantiating DevpighAgent, or let the agent configure it automatically.
logging.getLogger("devpigh.agent").addHandler(logging.NullHandler())
