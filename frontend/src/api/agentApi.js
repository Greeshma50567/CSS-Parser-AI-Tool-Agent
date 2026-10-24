const BASE_URL = "http://localhost:8000";

/**
 * Send a chat message to the Milestone 2 AI Agent endpoint (POST /api/chat).
 * Returns strictly the clean user-facing answer.
 * @param {string} message
 * @returns {Promise<{answer: string}>}
 */
export async function sendChatMessage(message) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * Query agent endpoint (POST /api/milestone-2/query).
 */
export async function queryAgent(query) {
  const res = await fetch(`${BASE_URL}/api/milestone-2/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * Run consistency verification (POST /api/milestone-2/verify-consistency).
 */
export async function verifyConsistency(query, runs = 2) {
  const res = await fetch(`${BASE_URL}/api/milestone-2/verify-consistency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, runs }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return res.json();
}
