from typing import AsyncGenerator
import httpx
import json
import logging
from fastapi import HTTPException

async def llama_stream(
    url: str,
    payload: dict,
) -> AsyncGenerator[str, None]:
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", url, json=payload) as response:

            if response.status_code != 200:
                error_msg = await response.aread()
                logging.error(f"Llama Server Error: {error_msg.decode()}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Llama server error",
                )

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue

                data_str = line[6:]
                if data_str.strip() == "[DONE]":
                    break

                data_json = json.loads(data_str)
                delta = data_json.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    yield content
