const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const {register, login} = require("./auth.js")

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));
app.post("/register", register)
app.post("/login", login)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    console.log("Incoming message:", message);
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing!");
        return res.status(500).json({ error: "Server configuration error" });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: message }]
                    }
                    ]
                })
            }
        )
        const data = await response.json();
        console.log("Gemini API response:", JSON.stringify(data, null, 2));

        if (data.error) {
            const errorMessage = data.error.code === 429
                ? "API Quota exceeded. Please try again in a minute."
                : "Gemini API Error: " + data.error.message;
            return res.json({ reply: errorMessage });
        }

        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'no reply'
        console.log("AI reply:", reply);

        res.json({ reply });

    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})
app.listen(3000, () => {
    console.log("Server started on port 3000");
})
