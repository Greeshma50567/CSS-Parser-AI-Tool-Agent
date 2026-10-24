"""
tests/test_tools.py
-------------------
Unit tests for all eight (8) backend tools.
Runs 100% offline without requiring a Groq API key or network access.
"""

import math
import pytest
from app.tools import (
    calculator,
    search_knowledge_base,
    get_current_datetime,
    convert_units,
    analyze_text,
    validate_json,
    analyze_csv,
    search_files,
)


# ===========================================================================
# 1. CALCULATOR TESTS
# ===========================================================================

def test_calculator_operations():
    assert calculator("add", 10, 5)["result"] == 15
    assert calculator("+", 10, 5)["result"] == 15
    assert calculator("subtract", 10, 5)["result"] == 5
    assert calculator("multiply", 25, 4)["result"] == 100
    assert calculator("divide", 20, 4)["result"] == 5


def test_calculator_division_by_zero():
    res = calculator("divide", 10, 0)
    assert res["success"] is False
    assert "Division by zero" in res["error"]


def test_calculator_invalid_operation():
    res = calculator("power", 2, 3)
    assert res["success"] is False
    assert "Unsupported operation" in res["error"]


def test_calculator_invalid_inputs():
    res = calculator("add", "abc", 5)
    assert res["success"] is False
    assert "Invalid numeric arguments" in res["error"]


def test_calculator_non_finite_values():
    res = calculator("add", float("nan"), 5)
    assert res["success"] is False
    assert "Non-finite" in res["error"]


# ===========================================================================
# 2. KNOWLEDGE BASE TESTS
# ===========================================================================

def test_knowledge_base_existing_query():
    res = search_knowledge_base("PRD-101 price")
    assert res["found"] is True
    assert len(res["results"]) > 0
    assert "129.99" in res["results"][0]["content"]
    assert res["results"][0]["source"] is not None


def test_knowledge_base_missing_query():
    res = search_knowledge_base("PRD-9999 non-existent widget")
    assert res["found"] is False
    assert "No matching information" in res["message"]


def test_knowledge_base_empty_query():
    res = search_knowledge_base("   ")
    assert res["found"] is False


def test_knowledge_base_determinism():
    res1 = search_knowledge_base("customer return policy")
    res2 = search_knowledge_base("customer return policy")
    assert res1 == res2


# ===========================================================================
# 3. DATE AND TIME TESTS
# ===========================================================================

def test_get_current_datetime_structure():
    res = get_current_datetime("UTC")
    assert "timestamp_iso" in res
    assert "date" in res
    assert "time" in res
    assert res["timezone"] == "UTC"
    assert len(res["date"].split("-")) == 3


def test_get_current_datetime_fallback():
    res = get_current_datetime("Invalid/Timezone_Name")
    assert res["timezone"] == "UTC"
    assert "timestamp_iso" in res


# ===========================================================================
# 4. UNIT CONVERTER TESTS
# ===========================================================================

def test_convert_units_linear():
    # 10 km = 6.21371 miles
    res = convert_units(10, "km", "miles")
    assert res["success"] is True
    assert round(res["result"], 2) == 6.21

    # 1 kg = 2.20462 lbs
    res_mass = convert_units(5, "kg", "lbs")
    assert res_mass["success"] is True
    assert round(res_mass["result"], 1) == 11.0


def test_convert_units_temperature():
    # 0 C = 32 F
    res_c_f = convert_units(0, "celsius", "fahrenheit")
    assert res_c_f["success"] is True
    assert res_c_f["result"] == 32.0

    # 100 C = 373.15 K
    res_c_k = convert_units(100, "celsius", "kelvin")
    assert res_c_k["success"] is True
    assert res_c_k["result"] == 373.15


def test_convert_units_incompatible():
    res = convert_units(10, "km", "celsius")
    assert res["success"] is False
    assert "Cannot convert" in res["error"]


def test_convert_units_invalid_numbers():
    res = convert_units("xyz", "km", "miles")
    assert res["success"] is False


# ===========================================================================
# 5. TEXT ANALYZER TESTS
# ===========================================================================

def test_analyze_text_standard():
    sample = "The quick brown fox jumps. It was amazing!"
    res = analyze_text(sample)
    assert res["word_count"] == 8
    assert res["character_count_with_spaces"] == len(sample)
    assert res["sentence_count"] == 2
    assert res["line_count"] == 1


def test_analyze_text_empty():
    res = analyze_text("")
    assert res["word_count"] == 0
    assert res["character_count_with_spaces"] == 0
    assert res["sentence_count"] == 0


def test_analyze_text_multiline():
    sample = "Line 1\nLine 2\nLine 3"
    res = analyze_text(sample)
    assert res["line_count"] == 3
    assert res["word_count"] == 6


# ===========================================================================
# 6. JSON VALIDATOR TESTS
# ===========================================================================

def test_validate_json_valid_objects():
    assert validate_json('{"name": "Alice", "age": 30}')["valid"] is True
    assert validate_json('[1, 2, 3]')["top_level_type"] == "list"
    assert validate_json('"hello"')["valid"] is True
    assert validate_json('true')["valid"] is True
    assert validate_json('null')["valid"] is True


def test_validate_json_invalid():
    res = validate_json('{"broken": json,')
    assert res["valid"] is False
    assert "Invalid JSON" in res["error"]
    assert "line" in res


def test_validate_json_empty_and_oversized():
    assert validate_json("")["valid"] is False
    assert validate_json(" " * 20)["valid"] is False
    assert validate_json("x" * 1_050_000)["valid"] is False


# ===========================================================================
# 7. CSV ANALYZER TESTS
# ===========================================================================

def test_analyze_csv_string():
    csv_text = """name,score,age\nAlice,95,24\nBob,80,30\nCharlie,90,28"""
    res = analyze_csv(csv_content=csv_text)
    assert res["success"] is True
    assert res["row_count"] == 3
    assert res["column_count"] == 3
    assert res["numeric_summaries"]["score"]["average"] == 88.3333
    assert res["numeric_summaries"]["age"]["min"] == 24.0


def test_analyze_csv_missing_values():
    csv_text = """name,score\nAlice,90\nBob,\nCharlie,100"""
    res = analyze_csv(csv_content=csv_text)
    assert res["missing_values"]["score"] == 1


def test_analyze_csv_empty():
    res = analyze_csv(csv_content="")
    assert res["success"] is False


# ===========================================================================
# 8. RESTRICTED FILE SEARCH TESTS
# ===========================================================================

def test_search_files_valid_query():
    res = search_files("Milestone", root_dir="allowed_data")
    assert res["success"] is True
    assert res["matches_count"] > 0
    assert any("project_notes.txt" in m["file"] for m in res["matches"])


def test_search_files_disallowed_directory_traversal():
    res = search_files("secret", root_dir="../../Windows")
    assert res["success"] is False
    assert "forbidden" in res["error"].lower() or "security" in res["error"].lower()


def test_search_files_empty_query():
    res = search_files("")
    assert res["success"] is False
