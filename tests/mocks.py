import asyncio

def make_mock_llama_stream(output: str):
    async def _stream(url: str, payload: dict):
        for token in output.split(" "):
            await asyncio.sleep(0)
            yield token + " "
    return _stream
