module.exports = async function handler(req, res) {
  return res.status(200).json({
    message: "API root",
    routes: {
      health: "/api/health",
      token: "/api/token",
      users: "/api/users",
    },
  });
};
