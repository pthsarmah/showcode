from backend.generators import ollama_stream, llama_stream

def get_llama_streamer():
    return llama_stream

def get_ollama_streamer():
    return ollama_stream
