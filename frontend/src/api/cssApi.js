const BASE_URL = "http://localhost:8000";

export async function parseCssFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/parse-css`, { method: "POST", body: form });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `Server error ${res.status}`); }
  return res.json();
}

export async function analyzeCssFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/analyze-css`, { method: "POST", body: form });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `Server error ${res.status}`); }
  return res.json();
}

export async function parseCssText(css, filename = "custom.css") {
  const res = await fetch(`${BASE_URL}/parse-css-text`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ css, filename }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `Server error ${res.status}`); }
  return res.json();
}

export async function analyzeCssText(css, filename = "custom.css") {
  const res = await fetch(`${BASE_URL}/analyze-css-text`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ css, filename }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `Server error ${res.status}`); }
  return res.json();
}

export async function getSampleCss() {
  const res = await fetch(`${BASE_URL}/api/sample-css`);
  if (!res.ok) throw new Error("Failed to load sample CSS");
  return res.json();
}
