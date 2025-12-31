from functools import lru_cache
from fastapi.testclient import TestClient
from backend.api import app

import backend.dependencies as dependencies
import mocks

import backend.config as config

client = TestClient(app)

@lru_cache
def get_settings():
    return config.Settings

def test_analyze_snippet_streaming():
    mock_stream = mocks.make_mock_llama_stream("hello world")

    app.dependency_overrides[dependencies.get_llama_streamer] = lambda: mock_stream
    client = TestClient(app)

    response = client.post(
        "/analyze_snippet_srvllama",
        headers={"x-local-snippet-model": "test-model"},
        json={"code": "print('hi')"},
    )

    chunks = list(response.iter_text())

    assert "".join(chunks) == "hello world "

    app.dependency_overrides.clear()
