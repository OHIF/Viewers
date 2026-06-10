"""Serve the built MIMPS viewer locally with SPA fallback and no URL logging."""

from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


class ViewerRequestHandler(SimpleHTTPRequestHandler):
    def _apply_spa_fallback(self) -> None:
        request_path = urlsplit(self.path).path
        target = Path(self.translate_path(request_path))
        if not target.exists():
            self.path = "/index.html"

    def do_GET(self) -> None:
        self._apply_spa_fallback()
        super().do_GET()

    def do_HEAD(self) -> None:
        self._apply_spa_fallback()
        super().do_HEAD()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        # Viewer URLs may contain a short-lived JWT during the auth handoff.
        return


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3000)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    directory = args.directory.resolve()
    if not (directory / "index.html").is_file():
        raise SystemExit(f"viewer build is missing index.html: {directory}")

    handler = partial(ViewerRequestHandler, directory=str(directory))
    server = ThreadingHTTPServer((args.host, args.port), handler)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
