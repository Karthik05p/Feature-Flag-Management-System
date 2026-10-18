from urllib.parse import urlsplit

import requests


class ASGIResponse:
    def __init__(self, response):
        self.status_code = response["status"]
        self._json = response["json"]

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}", response=self)

    def json(self):
        return self._json


class ASGIRequestsAdapter:
    """Transport real FlagClient requests into the existing ASGI test client."""

    def __init__(self, client):
        self.client = client
        self.calls = []

    def post(self, url, **kwargs):
        parsed = urlsplit(url)
        path = parsed.path + (f"?{parsed.query}" if parsed.query else "")
        self.calls.append({"url": url, "kwargs": kwargs})
        return ASGIResponse(
            self.client(
                "POST",
                path,
                headers=kwargs.get("headers"),
                body=kwargs.get("json"),
            )
        )
