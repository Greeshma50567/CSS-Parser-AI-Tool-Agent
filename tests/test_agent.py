"""
tests/test_agent.py
-------------------
Unit tests for agent orchestration logic with mocked Groq SDK.
Runs 100% offline without API key or network access.
"""

from unittest.mock import MagicMock, patch
import pytest
from app.agent import GroqAgent


class MockToolCall:
    def __init__(self, call_id, name, arguments):
        self.id = call_id
        self.function = MagicMock()
        self.function.name = name
        self.function.arguments = arguments


class MockMessage:
    def __init__(self, content, tool_calls=None):
        self.content = content
        self.tool_calls = tool_calls


class MockChoice:
    def __init__(self, message):
        self.message = message


class MockResponse:
    def __init__(self, choice):
        self.choices = [choice]


def test_agent_tool_dispatch_and_execution():
    agent = GroqAgent(api_key="mock_key")
    # Test safe internal execution of tool
    res = agent._execute_tool("calculator", '{"operation": "multiply", "a": 25, "b": 4}')
    assert res["success"] is True
    assert res["result"] == 100


def test_agent_rejects_unknown_tool():
    agent = GroqAgent(api_key="mock_key")
    res = agent._execute_tool("arbitrary_shell_command", '{"cmd": "ls"}')
    assert res["success"] is False
    assert "not in the approved tool registry" in res["error"]


def test_agent_handles_malformed_json_args():
    agent = GroqAgent(api_key="mock_key")
    res = agent._execute_tool("calculator", '{"operation": broken')
    assert res["success"] is False
    assert "Malformed arguments" in res["error"]


@patch("app.agent.Groq")
def test_agent_single_turn_no_tools(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client

    # Model responds immediately with final text
    mock_client.chat.completions.create.return_value = MockResponse(
        MockChoice(MockMessage("Hello! How can I assist you?"))
    )

    agent = GroqAgent(api_key="mock_key")
    answer = agent.run_sync("Hi")
    assert answer == "Hello! How can I assist you?"


@patch("app.agent.Groq")
def test_agent_executes_tool_call_loop(mock_groq_cls):
    mock_client = MagicMock()
    mock_groq_cls.return_value = mock_client

    # First turn requests calculator tool
    tool_call = MockToolCall("call_1", "calculator", '{"operation": "add", "a": 5, "b": 5}')
    turn1_resp = MockResponse(MockChoice(MockMessage("", tool_calls=[tool_call])))

    # Second turn formulates final grounded answer
    turn2_resp = MockResponse(MockChoice(MockMessage("5 plus 5 equals 10.")))

    mock_client.chat.completions.create.side_effect = [turn1_resp, turn2_resp]

    agent = GroqAgent(api_key="mock_key")
    answer, trace = agent.run_sync("What is 5 + 5?", return_trace=True)

    assert answer == "5 plus 5 equals 10."
    assert len(trace) == 1
    assert trace[0]["tool"] == "calculator"
    assert trace[0]["result"]["result"] == 10
