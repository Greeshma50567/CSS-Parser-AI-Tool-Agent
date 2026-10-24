"""
milestone1_parser.py
--------------------
Standalone CSS parsing module for Milestone 1.

What is extracted & why:
  - Selector(s): Identifies which HTML elements a rule targets.
  - Property-value pairs (dict): Captures the styling declarations in a
    key-value structure, making them trivially queryable/serialisable.
  - Property count: Gives a quick metric of rule complexity without
    iterating the dict externally.

Edge case considered:
  - URL values containing colons (e.g. `background: url('https://...')`).
    A naïve str.split(':') would fragment the URL; we use split(':', 1) to
    split only on the *first* colon, preserving the rest of the value intact.
"""

import re


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _strip_comments(css: str) -> str:
    """Remove all /* ... */ CSS comments (including multi-line ones)."""
    return re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)


def _parse_declarations(block: str) -> dict[str, str]:
    """
    Parse a CSS declaration block (everything inside { }) into a dict.

    Splits each declaration on the *first* colon only so that values
    containing URLs (e.g. background: url('https://example.com/img.png'))
    are preserved correctly.
    """
    declarations: dict[str, str] = {}

    for raw_decl in block.split(';'):
        decl = raw_decl.strip()
        if not decl:
            continue

        # Split on first colon only — critical for URL-valued properties
        parts = decl.split(':', 1)
        if len(parts) != 2:
            continue  # malformed declaration — skip silently

        prop = parts[0].strip().lower()
        value = parts[1].strip()

        if prop:  # guard against empty property names
            declarations[prop] = value

    return declarations


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_css(css_content: str) -> list[dict]:
    """
    Parse a raw CSS string and return a list of rule objects.

    Each rule object is a dict with the shape:
        {
            "selector":        str,          # e.g. "h1, h2"
            "properties":      dict[str,str],# e.g. {"color": "red"}
            "property_count":  int           # len(properties)
        }

    Rules with empty declaration blocks are skipped entirely.

    Args:
        css_content: Raw CSS string (may contain comments, multi-line rules).

    Returns:
        A list of parsed rule dicts. Empty if nothing parseable was found.
    """
    if not css_content or not css_content.strip():
        return []

    # Step 1 — remove comments so comment text can't pollute selectors/values
    clean_css = _strip_comments(css_content)

    # Step 2 — find every selector { declarations } block
    # The regex captures everything up to the matching closing brace.
    rule_pattern = re.compile(
        r'([^{}]+)\{([^{}]*)\}',   # selector { declarations }
        re.DOTALL
    )

    parsed_rules: list[dict] = []

    for match in rule_pattern.finditer(clean_css):
        raw_selector = match.group(1).strip()
        raw_block    = match.group(2).strip()

        # Skip empty or whitespace-only selectors
        if not raw_selector:
            continue

        # Normalise multi-line / extra-whitespace selectors to a single line
        selector = re.sub(r'\s+', ' ', raw_selector)

        # Parse declarations; skip rules with no valid properties
        properties = _parse_declarations(raw_block)
        if not properties:
            continue

        parsed_rules.append({
            "selector":       selector,
            "properties":     properties,
            "property_count": len(properties),
        })

    return parsed_rules
