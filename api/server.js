const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const { register, login, verifyToken } = require("./auth.js");
const pool = require("./db.js");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static("."));

app.post("/api/register", register);
app.post("/api/login", login);

// Проверка подключения к базе
pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error("Database connection error:", err.stack);
    } else {
        console.log("Database connected:", res.rows[0].now);
    }
});

pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS images JSONB DEFAULT NULL", (err) =>{
    if (err) console.error("Database connection error:", err.stack);
})
// ============================
// GET CHATS
// ============================

app.get("/api/chats", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, title, created_at FROM chats WHERE user_id = $1 ORDER BY created_at ASC",
            [req.userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Chats error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ============================
// CREATE CHAT
// ============================

app.post("/api/chats", verifyToken, async (req, res) => {
    const { title } = req.body;
    const chatTitle = title || "New Chat";

    try {

        const result = await pool.query(
            "INSERT INTO chats (user_id, title) VALUES ($1,$2) RETURNING id,title,created_at",
            [req.userId, chatTitle]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Chat creation error:", error);
        res.status(500).json({ error: "Server error creating chat" });
    }
});

// ============================
// GET CHAT MESSAGES
// ============================

app.get("/api/chats/:id/messages", verifyToken, async (req, res) => {

    const chatId = req.params.id;

    try {

        const chatCheck = await pool.query(
            "SELECT id FROM chats WHERE id=$1 AND user_id=$2",
            [chatId, req.userId]
        );

        if (chatCheck.rows.length === 0) {
            return res.status(403).json({ error: "Access denied" });
        }

        const result = await pool.query(
            "SELECT role,content, images FROM messages WHERE chat_id=$1 ORDER BY created_at ASC",
            [chatId]
        );

        res.json(result.rows);

    } catch (error) {

        console.error("Messages error:", error);
        res.status(500).json({ error: "Server error" });

    }
});

// ============================
// SEND MESSAGE
// ============================

app.post("/api/chats/:id/messages", verifyToken, async (req, res) => {

    const chatId = req.params.id;
    const { message, images } = req.body;
    const hasImages = Array.isArray(images) && images.length > 0;

    if (!message && !hasImages) {
        return res.status(400).json({ error: "Invalid message" });
    }

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY missing");
        return res.status(500).json({ error: "Server config error" });
    }

    try {

        const chatCheck = await pool.query(
            "SELECT id FROM chats WHERE id=$1 AND user_id=$2",
            [chatId, req.userId]
        );

        if (chatCheck.rows.length === 0) {
            return res.status(403).json({ error: "Access denied" });
        }

        // сохраняем сообщение пользователя
        const dbContent = message || (hasImages ? "[Image attached]" : "");
        const dbImages = hasImages ? JSON.stringify(images) : null
        await pool.query(
            "INSERT INTO messages (chat_id,role,content,images) VALUES ($1,$2,$3,$4)",
            [chatId, "user", dbContent, dbImages]
        );

        // генерируем новый title
        const titleSource = message || "[Image]";
        let newTitle = titleSource.length > 20 ? titleSource.substring(0, 20) + "..." : titleSource;

        // меняем title только если он New Chat
        await pool.query(
            "UPDATE chats SET title=$1 WHERE id=$2 AND title='New Chat'",
            [newTitle, chatId]
        );

        // Gemini API
        const parts = [];
        if (hasImages) {
            images.forEach(img => {
                parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
            });
        }
        // Gemini requires at least one text part
        parts.push({ text: message || "Describe what you see in the image." });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts }] })
            }
        );

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Gemini API error:", response.status, errBody);
            throw new Error("Gemini API error " + response.status + ": " + errBody);
        }

        const data = await response.json();

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "no reply";

        // сохраняем ответ AI
        await pool.query(
            "INSERT INTO messages (chat_id,role,content) VALUES ($1,$2,$3)",
            [chatId, "ai", reply]
        );

        res.json({ reply, newTitle });

    } catch (err) {

        console.error("Server error:", err);
        res.status(500).json({ error: "Internal server error" });

    }
});

app.delete("/api/chats/:id", verifyToken, async (req, res) => {
    const chatId = req.params.id
    try {
        const chatCheck = await pool.query("SELECT id FROM chats WHERE id = $1 AND user_id=$2", [chatId, req.userId])
        if (chatCheck.rows.length === 0) {
            return res.status(403).json({ error: "Access denied" });
        }
        await pool.query("DELETE FROM messages WHERE chat_id = $1", [chatId])

        await pool.query("DELETE FROM chats WHERE id = $1", [chatId])
        res.json({ message: "Chat deleted successfully." })
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Server error" });
    }
})


// app.listen(3000, () => {
//     console.log("Server started on port 3000");
// });

module.exports = app;
module.exports.default = app;