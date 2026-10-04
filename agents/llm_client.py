"""
CrisisGuard AI - Gemini LLM Client
Shared client for all agents using Google Gemini (google-genai SDK)
"""
import os
import logging
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_gemini_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            return None
        try:
            _client = genai.Client(api_key=api_key)
        except Exception as e:
            logging.warning(f"Failed to initialize Gemini Client: {e}")
            return None
    return _client


async def call_gemini(prompt: str, system_context: str = "") -> str:
    """Call Gemini 2.0 Flash with a prompt and return the response text.
    If client is unconfigured or returns an error, returns empty string
    so each agent gracefully engages its robust domain fallback.
    """
    try:
        client = get_gemini_client()
        if client is None:
            return ""

        contents = []
        if system_context:
            contents.append(system_context + "\n\n" + prompt)
        else:
            contents.append(prompt)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2048,
            ),
        )
        return response.text or ""
    except Exception as e:
        print(f"[Gemini API Notice] {e}. Engaging intelligent agent fallback.")
        return ""

