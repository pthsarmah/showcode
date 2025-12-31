from typing import Any
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.api import app  # adjust import

client = TestClient(app)

class FakeStreamResponse:
    def __init__(self):
        self._chunks = [
            {"response": "hello ", "done": False},
            {"response": "world", "done": False},
            {"done": True},
        ]
        self._index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self._chunks):
            raise StopAsyncIteration

        chunk = self._chunks[self._index]
        self._index += 1
        return chunk

    async def aread(self):
        return b""

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass

class FakeOllamaClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def generate(self, prompt, model, system, stream):
        return FakeStreamResponse()

def test_analyze_code_ollama_streaming_success():
    with patch("backend.api.client", new=FakeOllamaClient()):
        response = client.post(
            "/analyze_code_ollama",
            headers={"x-local-alignment-model": "test-model"},
            json={
                "code": "print('hi')",
                "context": "test context",
            },
        )

        assert response.status_code == 200

        chunks = list(response.iter_text())
        assert "".join(chunks) == "hello world" 

def test_analyze_code_ollama_incomplete_header():
    with patch("backend.api.client", new=FakeOllamaClient()):
        response = client.post(
            "/analyze_code_ollama",
            json={
                "code": "print('hi')",
                "context": "test context",
            },
        )

        print(response)
        assert response.status_code == 400
