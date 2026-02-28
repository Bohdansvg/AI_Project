const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require("./db.js")

async function register(req, res) {
    const { user_name, email, password } = req.body

    const hashed = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            "INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING id",
            [user_name, email, hashed]
        );

        const userId = result.rows[0].id;

        const token = jwt.sign(
            { id: userId },
            "SECRET_KEY",
            { expiresIn: "1h" }
        );
        res.json({ message: "User registered successfully", userId, token });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(400).json({ error: error.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body

    try {
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "User does not exist" });
        }

        const user = userResult.rows[0];
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(400).json({ error: "Wrong password or email" });
        }

        const token = jwt.sign(
            { id: user.id },
            "SECRET_KEY",
            { expiresIn: "1h" }
        );
        res.json({ token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: error.toString(), stack: error.stack });
    }
}

module.exports = { register, login }