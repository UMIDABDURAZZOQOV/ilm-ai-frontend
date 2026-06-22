async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.detail || data.error || `Request failed (${res.status})`;
    if (Array.isArray(msg)) {
      msg = msg.map((d) => d.msg || d.message || String(d)).join(". ");
    }
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.error || `Request failed (${res.status})`);
  }
  return data;
}

function getSession() {
  const raw = localStorage.getItem("ilm_session");
  return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
  localStorage.setItem(
    "ilm_session",
    JSON.stringify({
      id: user.user_id || user.id,
      name: user.name,
      email: user.email,
    })
  );
}

function clearSession() {
  localStorage.removeItem("ilm_session");
}

function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}
