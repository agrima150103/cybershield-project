const jwt = require("jsonwebtoken");
const config = require("../config");

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("[AUTH ERROR]", error.message);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

module.exports = authenticate;
module.exports.authenticate = authenticate;