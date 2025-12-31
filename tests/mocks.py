import asyncio
import ollama

def make_mock_llama_stream(output: str):
    async def _stream(url: str, payload: dict):
        for token in output.split(" "):
            await asyncio.sleep(0)
            yield token + " "
    return _stream

def make_mock_ollama_stream(output: str):
    async def _stream(client: ollama.AsyncClient | None, prompt: str, model: str):
        for token in output.split(" "):
            await asyncio.sleep(0)
            yield token + " "
    return _stream

def make_mock_anthropic_stream(output: str):
    async def _stream(client: ollama.AsyncClient | None, sys_prompt: str, prompt: str, model: str):
        for token in output.split(" "):
            await asyncio.sleep(0)
            yield token + " "
    return _stream
