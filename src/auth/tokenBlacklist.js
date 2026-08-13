const revokedTokens = new Map();

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function pruneExpiredTokens() {
  const now = nowSeconds();
  for (const [token, exp] of revokedTokens.entries()) {
    if (exp <= now) {
      revokedTokens.delete(token);
    }
  }
}

export function revokeToken(token, exp) {
  if (!token) return;
  const expiration = Number(exp);
  if (!Number.isFinite(expiration)) return;
  pruneExpiredTokens();
  revokedTokens.set(token, expiration);
}

export function isTokenRevoked(token) {
  if (!token) return false;
  pruneExpiredTokens();
  return revokedTokens.has(token);
}
