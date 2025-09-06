function decodeJwt(token) {
  try {
    if (!token) return null;
    const part = token.split(".")[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  const p = decodeJwt(token);
  if (!p || typeof p.exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return p.exp > now;
}

export {decodeJwt, isTokenValid};