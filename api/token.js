// Vercel function wrapper (frontend root deploys) delegating to backend logic.
module.exports = async function handler(req, res) {
  const mod = await import("../../backend/api/token.js");
  return mod.default(req, res);
};
