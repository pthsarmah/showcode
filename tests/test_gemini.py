import pytest
from unittest import mock
from fastapi.testclient import TestClient

from backend.api import app
from backend.api import CodeAnalysisRequest

client = TestClient(app)

class MockChunk:
    def __init__(self, text):
        self.text = text

class MockStream:
    def __iter__(self):
        yield MockChunk("hello ")
        yield MockChunk("world ")

@pytest.fixture
def mock_gemini_client():
    with mock.patch("backend.api.genai.Client") as mock_client:
        instance = mock_client.return_value
        instance.models.generate_content_stream.return_value = MockStream()
        yield mock_client

@pytest.fixture
def mock_decrypt():
    with mock.patch("backend.api.utils.decrypt_envelope") as decrypt:
        decrypt.return_value = "FAKE_API_KEY"
        yield decrypt

def test_analyze_codesnippet_streaming_success(mock_gemini_client, mock_decrypt):
    payload = {
        "code": "print('hello')",
        "context": "simple test"
    }

    headers = {
        "x-use-snippet-model": "false",
        "x-cloud-api-key": "encrypted",
        "x-cloud-encrypted-key": "encrypted",
        "x-cloud-iv": "iv",
    }

    response = client.post(
        "/analyze_snippet_gemini",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 200

    streamed_text = "".join(response.iter_text())
    assert streamed_text == "hello world "


def test_analyze_codesnippet_incomplete_headers(mock_gemini_client, mock_decrypt):
    payload = {
        "code": "print('hello')",
        "context": "simple test"
    }

    headers = {
        "x-use-snippet-model": "false",
        "x-cloud-api-key": "encrypted",
        "x-cloud-encrypted-key": "encrypted",
    }

    response = client.post(
        "/analyze_snippet_gemini",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 400

    headers = {
        "x-cloud-api-key": "encrypted",
        "x-cloud-encrypted-key": "encrypted",
        "x-cloud-iv": "iv",
    }

    response = client.post(
        "/analyze_snippet_gemini",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 400

    headers = {
        "x-use-snippet-model": "false",
        "x-cloud-encrypted-key": "encrypted",
        "x-cloud-iv": "iv",
    }

    response = client.post(
        "/analyze_snippet_gemini",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 400

    headers = {
        "x-use-snippet-model": "false",
        "x-cloud-api-key": "encrypted",
        "x-cloud-iv": "iv",
    }

    response = client.post(
        "/analyze_snippet_gemini",
        json=payload,
        headers=headers,
    )

    assert response.status_code == 400

def test_gemini_client_init_failure():
    with mock.patch("backend.api.genai.Client", side_effect=Exception("boom")):
        payload = {"code": "print('x')"}

        response = client.post(
            "/analyze_snippet_gemini",
            json=payload,
            headers={
                "x-use-snippet-model": "false",
                "x-cloud-api-key": "encrypted",
                "x-cloud-encrypted-key": "encrypted",
                "x-cloud-iv": "iv",
            }
        )

        assert response.status_code == 503
        assert "Gemini client is not initialized" in response.text
