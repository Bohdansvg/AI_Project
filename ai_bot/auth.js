const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require("./db.js")

 async function register(req, res) {
    const {user_name, email, password} = req.body

    const hashed = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            "INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING id", [user_name, email, hashed]
        )

        const userId = result.rows[0].id

        res.json({message: "User registered successfully", userId: userId})
    } catch (error) {
        // res.status(400).json({error: "User exists"})
        console.log(error);
        res.status(400).json({error: error.message})
    }
}

 async function login(req, res) {
    const {email, password} = req.body

    const user = await pool.query(
        "SELECT *FROM users WHERE  email = $1" [email]
    )
    if (users.rows.length === 0) {
        return res.status(400).json({error: "User does not exist"})
    }
    const valid = await bcrypt.compare(password, user.rows[0].password);

    if (!valid) {
        return res.status(400).json({error: "Wrong password or email"})
    }

    const token = jwt.sign(
        {id: user.rows[0].id},
        "SECRET_KEY",
        {expiresIn: "1h"}
    )
    res.json({token})
}

module.exports = {register, login}