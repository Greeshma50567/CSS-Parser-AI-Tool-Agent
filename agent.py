"""
agent.py
--------
Terminal entry point for Milestone 2 AI Agent.
Provides an interactive command-line interface for testing and demonstrating
function-calling tools, anti-hallucination guardrails, and deterministic reasoning.
"""

import sys
import os

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass
from pathlib import Path

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.agent import GroqAgent
from app.config import GROQ_MODEL, validate_config


def main():
    print("=" * 65)
    print(" 🤖 Milestone 2: Groq Function-Calling AI Agent (Terminal Mode)")
    print("=" * 65)

    try:
        cfg = validate_config(require_api_key=True)
        print(f" • Model:          {cfg['model']}")
        print(f" • Timezone:       {cfg['timezone']}")
        print(f" • Max Tool Calls: {cfg['max_tool_calls']}")
        print(f" • 8 Backend Tools: calculator, search_knowledge_base, get_current_datetime,")
        print(f"                   convert_units, analyze_text, validate_json, analyze_csv, search_files")
        print(" • Grounding:      Active (Anti-Hallucination Guardrails)")
    except Exception as exc:
        print(f"\n[Configuration Warning] {exc}")
        print("Please verify your GROQ_API_KEY in .env before executing queries.\n")

    print("-" * 65)
    print("Type your question below (or 'exit' / 'quit' to exit).")
    print("Optional flags: append '--trace' to view executed backend tool steps.")
    print("-" * 65)

    agent = GroqAgent()

    while True:
        try:
            user_input = input("\nUser > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting terminal agent. Goodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in ["exit", "quit", "q"]:
            print("Exiting terminal agent. Goodbye!")
            break

        show_trace = False
        if user_input.endswith("--trace"):
            show_trace = True
            user_input = user_input[:-7].strip()

        print("Agent is processing...", end="\r")

        try:
            answer, trace = agent.run_sync(user_input, return_trace=True)
            # Clear line
            print(" " * 40, end="\r")

            if show_trace and trace:
                print(f"\n[Tool Trace ({len(trace)} call(s))]:")
                for step in trace:
                    print(f"  Step {step['step']}: {step['tool']}({step['arguments']}) -> {step['result']}")

            print(f"\nAgent > {answer}")
        except Exception as exc:
            print(" " * 40, end="\r")
            print(f"\n[Error] {str(exc)}")


if __name__ == "__main__":
    main()
