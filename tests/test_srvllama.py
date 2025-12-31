from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.api import app  # adjust import

client = TestClient(app)


class FakeStreamResponse:
    status_code = 200

    async def aiter_lines(self):
        yield 'data: {"choices":[{"delta":{"content":"hello "}}]}'
        yield 'data: {"choices":[{"delta":{"content":"world"}}]}'
        yield "data: [DONE]"

    async def aread(self):
        return b""

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass


class FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass

    def stream(self, method, url, json):
        return FakeStreamResponse()

def test_analyze_code_srvllama_streaming_success():
    with patch("backend.api.httpx.AsyncClient", FakeAsyncClient):
        response = client.post(
            "/analyze_code_srvllama",
            headers={"x-local-alignment-model": "test-model"},
            json={
                "code": "print('hi')",
                "context": "test context",
            },
        )

        assert response.status_code == 200

        chunks = list(response.iter_text())
        assert "".join(chunks) == "hello world" 

def test_analyze_code_srvllama_incomplete_header():
    with patch("backend.api.httpx.AsyncClient", FakeAsyncClient):
        response = client.post(
            "/analyze_code_srvllama",
            json={
                "code": "print('hi')",
                "context": "test context",
            },
        )

        assert response.status_code == 400
