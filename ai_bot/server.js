// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
//
// const {register, login} = require("./auth.js")
//
// dotenv.config();
//
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static("."));
// app.post("/register", register)
// app.post("/login", login)
//
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
//
// const pool = require("./db.js")
// const {verify} = require("jsonwebtoken");
// const {verifyToken} = require("./auth");
// app.get("api/chats", verifyToken, async (req, res) => {
//     try {
//         const result = await pool.query(
//             "SELECT id, title, created_at FROM chats WHERE user_id = $1 ORDER BY created_at ASC ",
//             [req.userId]
//         )
//         res.json(result.rows)
//     } catch (error) {
//         console.log("Chats err", error);
//         res.status(500).send("Server error", error);
//     }
// })
//
// app.post("/api/chats", verifyToken, async (req, res) => {
//     const {title} = req.body;
//     const chatTitle = title || "New Chat";
//     try{
//         const result = await pool.query(
//             "INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at",
//             [req.userId, chatTitle],
//         )
//         res.json(result.rows[0])
//     }catch(error){
//         console.log(error, "Chat creation err");
//         res.status(500).json({error: "Server error bad try to create a chat"});
//     }
// })
//
// app.get("/api/chats/:id/messages", verifyToken, async (req, res) => {
//     const chatId = req.params.id;
//     try{
//         const chatCheck = await pool.query("SELECT id FROM chats WHERE id = $1 AND user_id = $2", [chatId, req.userId]);
//         if(chatCheck.rows.length === 0){
//             return res.status(403).json({error: "Access denied"});
//         }
//         const result = await pool.query("SELECT role, content FROM messages WHERE chat_id = $1 ORDER BY created_at ASC ",[chatId]);
//         res.json(result.rows)
//     } catch (error) {
//         console.error("Message err", error);
//         res.status(500).json({error: "Server error"});
//     }
// })
//
// app.post("/api/chats/:id/messages",verifyToken, async (req, res) => {
//     const chatId = req.params.id;
//     const { message } = req.body;
//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
//
//     if (!GEMINI_API_KEY) {
//         console.error("GEMINI_API_KEY is missing!");
//         return res.status(500).json({ error: "Server configuration error" });
//     }
//
//     try {
//         const chatCheck = await pool.query("SELECT id FROM chats WHERE id = $1 AND user_id = $2", [chatId, req.userId]);
//         if(chatCheck.rows.length === 0) {
//             return res.status(403).json({error: "Access denied"});
//         }
//
//         await pool.query(
//             "INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)",
//             [chatId, 'user', message],
//         )
//
//         const response = await fetch(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
//             {
//                 method: "POST",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({
//                     contents: [{
//                         parts: [{text: message}]
//                     }]
//                 })
//             }
//         )
//         const data = await response.json();
//
//         if (data.error) {
//             const errorMessage = data.error.code === 429
//                 ? "API Quota exceeded. Please try again in a minute."
//                 : "Gemini API Error: " + data.error.message;
//             return res.json({ reply: errorMessage });
//         }
//
//         const reply = data?.candidates?.parts?.[0]?.text ?? 'no reply'
//
//         await pool.query(
//             "INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)",
//             [chatId, 'ai' , message],
//         )
//
//
//         res.json({ reply });
//
//     } catch (err) {
//         console.error("FetchDB error:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// })
// app.listen(3000, () => {
//     console.log("Server started on port 3000");
// })
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const {register, login} = require("./auth.js")

const path = require("path");
dotenv.config({path: path.join(__dirname, ".env")});

const app = express();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
app.use(cors());
app.use(express.json());
app.use(express.static("."));
app.post("/register", register)
app.post("/login", login)

const pool = require("./db.js")

// Check DB connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error on startup:', err.stack);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

const {verify} = require("jsonwebtoken");
const {verifyToken} = require("./auth");

// Global error handlers to catch why the process might exit
process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error', err);
    // keeping the process alive for debugging
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
app.get("/api/chats", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, title, created_at FROM chats WHERE user_id = $1 ORDER BY created_at ASC ",
            [req.userId]
        )
        res.json(result.rows)
    } catch (error) {
        console.log("Chats err", error);
        res.status(500).send("Server error", error);
    }
})

app.post("/api/chats", verifyToken, async (req, res) => {
    const {title} = req.body;
    const chatTitle = title || "New Chat";
    try {
        const result = await pool.query(
            "INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at",
            [req.userId, chatTitle],
        )
        res.json(result.rows[0])
    } catch (error) {
        console.log(error, "Chat creation err");
        res.status(500).json({error: "Server error bad try to create a chat"});
    }
})

app.get("/api/chats/:id/messages", verifyToken, async (req, res) => {
    const chatId = req.params.id;
    try {
        const chatCheck = await pool.query("SELECT id FROM chats WHERE id = $1 AND user_id = $2", [chatId, req.userId]);
        if (chatCheck.rows.length === 0) {
            return res.status(403).json({error: "Access denied"});
        }
        const result = await pool.query("SELECT role, content FROM messages WHERE chat_id = $1 ORDER BY created_at ASC ", [chatId]);
        res.json(result.rows)
    } catch (error) {
        console.error("Message err", error);
        res.status(500).json({error: "Server error"});
    }
})

app.post("/api/chats/:id/messages", verifyToken, async (req, res) => {
        const chatId = req.params.id;
        const {message} = req.body;

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing!");
            return res.status(500).json({reply: "Помилка сервера: GEMINI_API_KEY не знайдений. Переконайтесь, що .env підключено."});
        }

        try {
            const chatCheck = await pool.query("SELECT id FROM chats WHERE id = $1 AND user_id = $2", [chatId, req.userId]);
            if (chatCheck.rows.length === 0) {
                return res.status(403).json({error: "Access denied"});
            }

            await pool.query(
                "INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)",
                [chatId, 'user', message],
            )

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        contents: [{
                            parts: [{text: message}]
                        }]
                    })
                }
            )
            const data = await response.json();
            console.log("Full Gemini API Response:", JSON.stringify(data, null, 2));

            const msgCheck = await pool.query("SELECT COUNT(*) FROM messages WHERE chat_id = $1", [chatId])
            let newTitle = null

            if (parseInt(msgCheck.rows[0].count) === 1) {
                try {
                    const titlePrompt = `Придумай дуже коротку назву (2 слова) для чату на основі цього повідомлення "${message}"Пиши тільки назву без лапок та коментарів"}`
                    const titleResponse = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                        {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{text: message}]
                                }]
                            })
                        }
                    )
                    const titleData = await response.json()

                    if (!titleData.error && titleData?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        newTitle = titleData.candidates[0].content.parts[0].text.trim().replace(/^\* (.*$)/gim, '<li>$1</li>')
                        await pool.query("UPDATE chats SET title = $1 WHERE id= $2", [newTitle, chatId])
                    }
                } catch (error) {
                    console.error("title err", error);
                }

            }

            if (data.error) {
                const errorMessage = data.error.code === 429
                    ? "API Quota exceeded. Please try again in a minute."
                    : "Gemini API Error: " + data.error.message;
                return res.json({reply: errorMessage});
            }

            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'no reply'
            console.log("Extracted Reply:", reply);

            await pool.query(
                "INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)",
                [chatId, 'ai', reply],
            )


            res.json({reply, newTitle});

        } catch
            (err) {
            console.error("FetchDB error:", err);
            res.status(500).json({error: "Internal server error"});
        }
    }
)
app.listen(3000, () => {
    console.log("Server started on port 3000");
})

