# Milestone 2 — Function-Calling AI Agent with Groq API

A production-grade, secure, deterministic AI Agent built with **FastAPI**, **Groq Python SDK**, and **React**. The agent leverages genuine LLM function calling to route queries to 8 sandboxed Python tools, enforces strict anti-hallucination guardrails, and guarantees complete frontend privacy.

---

## 1. Project Objective

The objective of Milestone 2 is to demonstrate genuine LLM function calling and grounded execution:
- The Groq LLM understands user intentions and selects suitable backend tools.
- Tools execute **locally and deterministically** in Python (no arbitrary code execution, no `eval()`).
- The agent formulates its final answer strictly based on verified tool results.
- **Frontend Privacy**: Internal tool names, function-call arguments, raw results, and execution traces remain strictly hidden on the server. The frontend receives only clean conversational answers.
- Dual interface support:
  1. **Terminal CLI**: Interactive terminal for testing, evaluation, and demonstration (`python agent.py`).
  2. **FastAPI Backend**: `POST /api/chat` connecting to a modern React chat interface.

---

## 2. Architecture Diagram & Flow Description

```
                       ┌────────────────────────┐
                       │   Frontend / Client    │
                       │   (React / Terminal)   │
                       └───────────┬────────────┘
                                   │ User Query: "What is 25 multiplied by 4?"
                                   ▼
                       ┌────────────────────────┐
                       │   FastAPI / CLI Agent  │
                       │   (app/agent.py)       │
                       └───────────┬────────────┘
                                   │ 1. Pass Prompt + 8 Tool Schemas
                                   ▼
                       ┌────────────────────────┐
                       │      Groq LLM API      │
                       │ (llama-3.3-70b/gpt-oss)│
                       └───────────┬────────────┘
                                   │ 2. Tool Call Request:
                                   │    calculator(operation="multiply", a=25, b=4)
                                   ▼
                       ┌────────────────────────┐
                       │  Python Tool Registry  │
                       │     (app/tools.py)     │
                       └───────────┬────────────┘
                                   │ 3. Deterministic Local Execution:
                                   │    {"success": true, "result": 100}
                                   ▼
                       ┌────────────────────────┐
                       │   Feed Tool Result     │
                       │    Back to Groq        │
                       └───────────┬────────────┘
                                   │ 4. Grounded Final Answer Formulation
                                   ▼
                       ┌────────────────────────┐
                       │   Final User Response  │
                       │  "25 multiplied by 4   │
                       │      equals 100."      │
                       └────────────────────────┘
```

---

## 3. Agent Execution Workflow

1. **Query Ingestion**: Receives query via `POST /api/chat` or terminal prompt.
2. **Schema Dispatch**: Sends system instructions, conversation history, and 8 registered tool definitions to Groq.
3. **Function-Call Detection**: If Groq emits `tool_calls`, the agent intercepts them before user response generation.
4. **Validation & Local Execution**: Checks tool name against `TOOL_REGISTRY`, validates JSON arguments, and executes the Python function.
5. **Context Augmentation**: Formats the execution output as a structured `tool` message and appends it to the conversation history.
6. **Grounding & Iteration**: Sends the updated conversation back to Groq. Supports sequential or multiple tool calls up to `GROQ_MAX_TOOL_CALLS` (default 8).
7. **Clean Delivery**: Returns strictly the final assistant answer string.

---

## 4. Explanation of All Eight Backend Tools

| Tool | Function Signature | Description |
| :--- | :--- | :--- |
| **1. Calculator** | `calculator(operation, a, b)` | Basic arithmetic (`add`, `subtract`, `multiply`, `divide`). Handles division by zero, non-finite values (NaN/Inf). No `eval()`. |
| **2. Knowledge Base Search** | `search_knowledge_base(query)` | Keyword retrieval from local `knowledge_base.json`. Returns source citations. Returns explicit `found: false` when query is absent. |
| **3. Date & Time** | `get_current_datetime(timezone_name)` | Returns fresh real-time timestamp, ISO date, day of week, and timezone offsets using `zoneinfo`. |
| **4. Unit Converter** | `convert_units(value, from_unit, to_unit)` | Deterministic conversions for Length (`km`, `miles`, `m`, `ft`, `cm`, `in`), Mass (`kg`, `lbs`, `g`), and Temperature (`celsius`, `fahrenheit`, `kelvin`). |
| **5. Text Analyzer** | `analyze_text(text)` | Computes word count, character count (with/without spaces), line count, and sentence count locally. |
| **6. JSON Validator** | `validate_json(json_string)` | Validates JSON structure, returns top-level data type and element count, or reports safe syntax error line/col. |
| **7. CSV Analyzer** | `analyze_csv(csv_content, file_path)` | Summarizes row/column counts, missing values, and numerical statistics (min, max, sum, average) on permitted files. |
| **8. Restricted File Search** | `search_files(query, root_dir, file_extension)` | Searches text files strictly within permitted directories (`allowed_data/`). Rejects path traversal and excludes secrets (`.env`). |

---

## 5. Information Extraction & Tool Selection Rationale

- **Deterministic Accuracy**: Mathematical operations and unit formulas must not be hallucinated by token probability; Python ensures exact mathematical precision.
- **Truth Grounding**: Corporate policies and hardware specs are grounded in `knowledge_base.json`. If an item is missing, the agent states that the information is unavailable rather than fabricating data.
- **Privacy & Security**: File operations are strictly sandboxed. The model cannot read arbitrary directories or expose secret environment variables.

---

## 6. Technology Stack

- **Language**: Python 3.11+
- **LLM Provider**: Groq Cloud API (`groq` SDK v0.11+)
- **Models Supported**: `llama-3.3-70b-versatile`, `openai/gpt-oss-120b`, `llama-3.1-8b-instant`
- **Backend**: FastAPI, Uvicorn, Pydantic v2
- **Testing**: `pytest`, `httpx`
- **Frontend**: React 19, Vite, React Router v7

---

## 7. Prerequisites

- Python 3.11 or newer installed.
- Node.js 18+ (for frontend).
- A valid Groq API Key ([console.groq.com](https://console.groq.com/keys)).

---

## 8. Installation Instructions (Windows PowerShell)

```powershell
# 1. Clone / Navigate to project
cd d:\Milestone

# 2. Create and activate Python virtual environment
python -m venv venv
.env\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 9. Groq API Key Setup

1. Sign up at [https://console.groq.com](https://console.groq.com).
2. Generate an API Key under **API Keys**.
3. Create your `.env` file from the template:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Open `.env` and insert your key:
   ```ini
   GROQ_API_KEY=gsk_your_actual_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_MAX_TOOL_CALLS=8
   APP_TIMEZONE=UTC
   ```

---

## 10. Environment Configuration

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | *(required)* | Groq authentication token |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Tool-calling LLM model name |
| `GROQ_MAX_TOOL_CALLS` | `8` | Maximum tool iterations per user query |
| `APP_TIMEZONE` | `UTC` | Default timezone for timestamp tool |

---

## 11. How to Run the Terminal Agent

```powershell
# Run the interactive CLI agent
python agent.py

# Optional: View executed tool traces in terminal mode
User > What is 25 multiplied by 4? --trace
```

---

## 12. How to Start the FastAPI Server

```powershell
# Start FastAPI backend
python -m uvicorn main:app --reload --port 8000
```
- Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Probe: [http://localhost:8000/api/health](http://localhost:8000/api/health)

To start the React frontend:
```powershell
cd frontend
npm run dev
```
- Frontend UI: [http://localhost:5173/milestone-2](http://localhost:5173/milestone-2)

---

## 13. API Request and Response Examples

### POST `/api/chat`

**Request:**
```json
{
  "message": "What is 25 multiplied by 4?"
}
```

**Response (HTTP 200 OK):**
```json
{
  "answer": "25 multiplied by 4 equals 100."
}
```

---

## 14. How to Run Automated Tests

The unit and API test suite is 100% offline and requires no internet or credentials:

```powershell
# Run all 37 automated tests
python -m pytest tests/ -v
```

---

## 15. How to Run Live API Integration Tests

To test live tool dispatch against Groq:
```powershell
# Test calculator tool live
python -c "import requests; print(requests.post('http://127.0.0.1:8000/api/chat', json={'message': 'What is 25 multiplied by 4?'}).json())"

# Test missing knowledge base live
python -c "import requests; print(requests.post('http://127.0.0.1:8000/api/chat', json={'message': 'What is the price of PRD-999?'}).json())"
```

---

## 16. Hallucination-Prevention Strategy

1. **System Prompt Rules**: Explicitly instructs the LLM that calculation or policy facts cannot be guessed.
2. **Defensive Knowledge Base**: If `search_knowledge_base` returns `found: false`, the model is constrained to report that the information is unavailable.
3. **Controlled Tool Execution**: Math is computed in Python; the model receives the numeric output and grounds its phrasing strictly upon it.
4. **Temperature 0.0**: Minimizes sampling randomness for factual determinism.

---

## 17. Consistency-Testing Strategy

- Deterministic tools produce identical outputs for identical inputs.
- Repeatable questions (e.g. `25 * 4` or `return policy`) generate consistent factual conclusions.
- Unit tests verify deterministic results independently of the LLM.

---

## 18. File-Search Security Restrictions

1. **Root Directory Whitelisting**: Searches are strictly confined to `ALLOWED_SEARCH_ROOTS` (`allowed_data/`, `static/`).
2. **Path Traversal Prevention**: `..` and escaped absolute paths are rejected.
3. **Secret File Exclusion**: `.env`, `credentials`, `secrets`, `.git`, `id_rsa` are filtered out.
4. **Resource Constraints**: Maximum file size (1MB), max results (10), max snippet length (150 chars).

---

## 19. Frontend / Backend Privacy Separation

- **Frontend Privacy Guarantee**: The React chat interface only renders the user message and the final assistant response.
- **Trace Isolation**: Tool names, raw parameters, and intermediate JSON results are logged server-side and never returned in API payloads.

---

## 20. Known Limitations

1. **Token Rate Limits**: Free-tier Groq API keys may be subject to TPM (tokens per minute) rate limits.
2. **Keyword Knowledge Base**: The knowledge base uses keyword token overlap rather than high-dimensional vector embeddings.
3. **Single Timezone Default**: Unless specified by the user in the prompt, timestamps reflect the configured server timezone (`APP_TIMEZONE`).
