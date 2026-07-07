"""Entry point for `python -m legal_term` and the `legal-term` console script.

Flags:
  --live [URL]   Connect to a running legal-mcp SSE server instead of mock data.
                 URL defaults to the LEGAL_MCP_URL env var, or http://localhost:8000.
"""
from __future__ import annotations

import argparse
import os


def main() -> None:
    parser = argparse.ArgumentParser(description="Legal Terminal TUI")
    parser.add_argument(
        "--live",
        nargs="?",
        const=True,
        metavar="URL",
        help="Connect to live legal-mcp server (default: http://localhost:8000)",
    )
    args = parser.parse_args()

    from .app import LegalTermApp

    client = None
    if args.live is not None:
        url = (
            args.live
            if isinstance(args.live, str)
            else os.environ.get("LEGAL_MCP_URL", "http://localhost:8000")
        )
        from .live_client import LiveClient
        client = LiveClient(url=url)
        print(f"[legal-terminal] LiveClient → {url}")
    else:
        print("[legal-terminal] MockClient (pass --live to connect to legal-mcp server)")

    app = LegalTermApp(client=client)
    app.run()


if __name__ == "__main__":
    main()
