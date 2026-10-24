"""
tests/test_api.py
-----------------
API integration tests for FastAPI POST /api/chat endpoint.
Uses FastAPI TestClient and mocks the LLM response to verify
endpoint status codes, schema validation, and strict privacy guarantees.
"""

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
import pytest
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@patch("app.main.agent.run_async", new_callable=AsyncMock)
def test_chat_success(mock_run):
    mock_run.return_value = "25 multiplied by 4 is 100."
    
    res = client.post("/api/chat", json={"message": "What is 25 multiplied by 4?"})
    assert res.status_code == 200
    data = res.json()

    # Crucial Privacy Verification: Only "answer" must be returned
    assert "answer" in data
    assert data["answer"] == "25 multiplied by 4 is 100."

    # Verify no tool execution details are leaked
    assert "tools_used" not in data
    assert "trace" not in data
    assert "tool_calls" not in data
    assert "arguments" not in data


def test_chat_empty_message():
    res = client.post("/api/chat", json={"message": "   "})
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_chat_missing_body():
    res = client.post("/api/chat", json={})
    assert res.status_code == 422  # Pydantic validation error


@patch("app.main.agent.run_async", new_callable=AsyncMock)
def test_chat_safe_error_handling(mock_run):
    mock_run.side_effect = Exception("Internal upstream timeout")

    res = client.post("/api/chat", json={"message": "Test query"})
    assert res.status_code == 502
    assert "Agent service error" in res.json()["detail"]
