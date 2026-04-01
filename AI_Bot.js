// const API = "/api"
// let currentChatId = null;
// let chatsData = []
//
// if (!localStorage.getItem("token")) {
//     window.location.href = "auth.html"
// }
//
// const input = document.getElementById("userInput");
// input.addEventListener("keydown", function (event) {
//     if (event.key === "Enter") {
//         event.preventDefault();
//         sendMessage();
//     }
// })
//
// function addMessage(text, type) {
//     const messageContainer = document.getElementById("messages");
//     const row = document.createElement("div");
//     row.className = "message-row " + type;
//     const avatar = document.createElement("div")
//     avatar.className = "avatar";
//     avatar.textContent = type === "user" ? "U" : " ";
//     const content = document.createElement("div");
//     content.className = "message-content";
//     content.textContent = text;
//     content.innerHTML = formatMessage(text)
//
//
//     const copyBtn = document.createElement("button");
//     copyBtn.className = "copy";
//
//     copyBtn.addEventListener("click", function () {
//         navigator.clipboard.writeText(text)
//             .then(() => {
//                 copyBtn.style.opacity = "0.5";
//                 setTimeout(() => {
//                     copyBtn.style.opacity = "1";
//                 }, 500);
//             })
//     })
//     content.appendChild(copyBtn);
//     row.appendChild(avatar);
//     row.appendChild(content);
//
//     messageContainer.appendChild(row);
//     messageContainer.scrollTop = messageContainer.scrollHeight;
// }
//
// function sendMessage() {
//     if (!currentChatId) return;
//     const input = document.getElementById("userInput");
//     const text = input.value.trim();
//     if (!text) return;
//
//     addMessage(" " + text, "user");
//     input.value = "";
//
//     fetch(`${API}/chats/${currentChatId}/messages`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${localStorage.getItem("token")}`
//         },
//         body: JSON.stringify({message: text})
//     })
//         .then(res => res.json())
//         .then(data => {
//             if (data.newTitle) {
//                 document.getElementById("chatTitle").textContent = data.newTitle;
//                 const chatIndex = chatsData.findIndex(c => c.id === currentChatId);
//                 if (chatIndex !== -1) {
//                     chatsData[chatIndex].title = data.newTitle;
//                     renderChatList(chatsData);
//                 }
//             }
//
//
//             addMessage(" " + data.reply, "ai");
//         })
//         .catch(() => {
//             addMessage("AI error", "ai");
//         });
// }
//
//
// function formatMessage(text) {
//     let format = text
//         .replace(/```(\w+)?([\s\S]*?)```/g, (match, lang, code) => {
//             return `<pre><code>${code.trim()}</code></pre>`;
//         })
//         .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
//         .replace(/^### (.*$)/gim, '<h3>$1</h3>')
//         .replace(/^\* (.*$)/gim, '<li>$1</li>')
//         .replace(/\n/g, '<br>');
//     if (format.includes('<li>')) {
//         format = format.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
//     }
//     return format;
// }
//
// function logout() {
//     localStorage.removeItem("token");
//     window.location.href = "auth.html";
// }
//
// document.addEventListener("DOMContentLoaded", loadChats)
//
// async function loadChats() {
//     const token = localStorage.getItem("token");
//     try {
//         const res = await fetch(`${API}/chats`, {
//             headers: {"Authorization": `Bearer ${token}`}
//         })
//
//         if (res.ok) {
//             chatsData = await res.json();
//             renderChatList(chatsData);
//
//             if (chatsData.length > 0 && currentChatId === null) {
//                 selectChat(chatsData[0].id, chatsData[0].title);
//             } else if (chatsData.length === 0) {
//                 createNewChat();
//             }
//         }
//     } catch (err) {
//         console.error("Error loading chats", err);
//     }
//
// }
//
// function renderChatList(chats) {
//     const chatList = document.getElementById("chatList");
//     chatList.innerHTML = "";
//     chats.forEach(chat => {
//         const div = document.createElement("div");
//         div.className = `chat-item ${chat.id === currentChatId ? "active" : ""}`;
//
//         const titleSpan = document.createElement("span");
//         titleSpan.textContent = chat.title;
//         titleSpan.style.flex = "1"
//         titleSpan.style.overflow = "hidden";
//         titleSpan.textOverflow = "ellipsis";
//         titleSpan.style.whiteSpace = "nowrap";
//
//         const deleteBtn = document.createElement("button");
//         deleteBtn.className = "delete";
//         deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
//         deleteBtn.onclick = (e) => deleteChat(chat.id, e)
//         div.appendChild(titleSpan);
//         div.appendChild(deleteBtn);
//         div.onclick = () => selectChat(chat.id, chat.title);
//         chatList.appendChild(div);
//     })
// }
//
// async function createNewChat() {
//     const token = localStorage.getItem("token");
//     try {
//         const res = await fetch(`${API}/chats`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`
//             },
//             body: JSON.stringify({title: "New Chat"})
//         })
//         if (res.ok) {
//             const newChat = await res.json();
//             selectChat(newChat.id, newChat.title);
//             renderChatList(chatsData);
//         }
//     } catch (err) {
//         console.error("Error creating chat", err);
//     }
// }
//
// async function selectChat(id, title) {
//     currentChatId = id;
//     document.getElementById("chatTitle").textContent = title;
//     document.getElementById("messages").innerHTML = ""
//
//     document.getElementById("userInput").disabled = false;
//     document.getElementById("sendBtn").disabled = false;
//
//     document.querySelectorAll('.chat-item').forEach(el => {
//         el.classList.toggle('active', el.textContent === title);
//     })
//
//     const token = localStorage.getItem("token");
//     try {
//         const res = await fetch(`${API}/chats/${currentChatId}/messages`, {
//             headers: {"Authorization": `Bearer ${token}`}
//         })
//
//         if (res.ok) {
//             const messages = await res.json();
//             messages.forEach(msg => {
//                 addMessage(" " + msg.content, msg.role)
//             })
//         }
//
//
//     } catch (err) {
//         console.error("Error loading history", err);
//     }
// }
//
// function toggleSidebar() {
//
//     const sidebar = document.querySelector(".sidebar");
//
//     sidebar.classList.toggle("active");
// }
//
// async function deleteChat(chatId, event) {
//     event.stopPropagation();
//
//     if (!confirm("Are you sure you want to delete this chat?")) {
//         return;
//     }
//
//     const token = localStorage.getItem("token");
//     try {
//         const res = await fetch(`${API}/chats/${chatId}`, {
//             method: "DELETE",
//             headers: {"Authorization": `Bearer ${token}`}
//         })
//
//         if (res.ok) {
//             chatsData = chatsData.filter(chat => chat.id !== chatId);
//             renderChatList(chatsData);
//
//             if (currentChatId === chatId) {
//                 currentChatId = null;
//                 document.getElementById("chatTitle").textContent = "Select a chat";
//                 document.getElementById("messages").innerHTML = ""
//                 document.getElementById("userInput").disabled = true;
//                 document.getElementById("sendBtn").disabled = true;
//
//                 if (chatsData.length > 0) {
//                     selectChat(chatsData[0].id, chatsData[0].title);
//                 }
//             }
//         }
//     } catch (err) {
//         console.error("Error deleting chat", err);
//     }
// }

const API = "/api"
let currentChatId = null;
let chatsData = []

if (!localStorage.getItem("token")) {
    window.location.href = "auth.html"
}

const input = document.getElementById("userInput");
input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
})

function addMessage(text, type) {
    const messageContainer = document.getElementById("messages");
    const row = document.createElement("div");
    row.className = "message-row " + type;
    const avatar = document.createElement("div")
    avatar.className = "avatar";
    avatar.textContent = type === "user" ? "U" : " ";
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = formatMessage(text)

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy";

    copyBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(text)
            .then(() => {
                copyBtn.style.opacity = "0.5";
                setTimeout(() => {
                    copyBtn.style.opacity = "1";
                }, 500);
            })
    })
    content.appendChild(copyBtn);
    row.appendChild(avatar);
    row.appendChild(content);

    messageContainer.appendChild(row);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

function sendMessage() {
    if (!currentChatId) return;
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;

    addMessage(" " + text, "user");
    input.value = "";

    fetch(`${API}/chats/${currentChatId}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({message: text})
    })
        .then(res => res.json())
        .then(data => {
            if (data.newTitle) {
                document.getElementById("chatTitle").textContent = data.newTitle;
                const chatIndex = chatsData.findIndex(c => c.id === currentChatId);
                if (chatIndex !== -1) {
                    chatsData[chatIndex].title = data.newTitle;
                    renderChatList(chatsData);
                }
            }
            addMessage(" " + data.reply, "ai");
        })
        .catch(() => {
            addMessage("AI error", "ai");
        });
}

function formatMessage(text) {
    let format = text
        .replace(/```(\w+)?([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        })
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/\n/g, '<br>');
    if (format.includes('<li>')) {
        format = format.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
    }
    return format;
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "auth.html";
}

document.addEventListener("DOMContentLoaded", loadChats)

async function loadChats() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/chats`, {
            headers: {"Authorization": `Bearer ${token}`}
        })

        if (res.ok) {
            chatsData = await res.json();
            renderChatList(chatsData);

            if (chatsData.length > 0 && currentChatId === null) {
                selectChat(chatsData[0].id, chatsData[0].title);
            } else if (chatsData.length === 0) {
                createNewChat();
            }
        }
    } catch (err) {
        console.error("Error loading chats", err);
    }
}

function renderChatList(chats) {
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";
    chats.forEach(chat => {
        const div = document.createElement("div");
        div.className = `chat-item ${chat.id === currentChatId ? "active" : ""}`;

        const titleSpan = document.createElement("span");
        titleSpan.textContent = chat.title;
        titleSpan.style.flex = "1"
        titleSpan.style.overflow = "hidden";
        titleSpan.style.textOverflow = "ellipsis";
        titleSpan.style.whiteSpace = "nowrap";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete";
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
        deleteBtn.onclick = (e) => deleteChat(chat.id, e)
        div.appendChild(titleSpan);
        div.appendChild(deleteBtn);
        div.onclick = () => {
            selectChat(chat.id, chat.title);
            // На мобильном — закрываем сайдбар после выбора чата
            if (window.innerWidth <= 600) {
                closeSidebar();
            }
        };
        chatList.appendChild(div);
    })
}

async function createNewChat() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/chats`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({title: "New Chat"})
        })
        if (res.ok) {
            const newChat = await res.json();
            chatsData.unshift(newChat);
            selectChat(newChat.id, newChat.title);
            renderChatList(chatsData);
            // На мобильном — закрываем сайдбар
            if (window.innerWidth <= 600) {
                closeSidebar();
            }
        }
    } catch (err) {
        console.error("Error creating chat", err);
    }
}

async function selectChat(id, title) {
    currentChatId = id;
    document.getElementById("chatTitle").textContent = title;
    document.getElementById("messages").innerHTML = ""

    document.getElementById("userInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;

    document.querySelectorAll('.chat-item').forEach(el => {
        el.classList.toggle('active', el.querySelector('span')?.textContent === title);
    })

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/chats/${currentChatId}/messages`, {
            headers: {"Authorization": `Bearer ${token}`}
        })

        if (res.ok) {
            const messages = await res.json();
            messages.forEach(msg => {
                addMessage(" " + msg.content, msg.role)
            })
        }
    } catch (err) {
        console.error("Error loading history", err);
    }
}

// ── Sidebar ──
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const isOpen = sidebar.classList.contains("active");
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    document.getElementById("sidebar").classList.add("active");
    document.getElementById("sidebarOverlay").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("sidebarOverlay").classList.remove("active");
    document.body.style.overflow = "";
}

async function deleteChat(chatId, event) {
    event.stopPropagation();

    if (!confirm("Are you sure you want to delete this chat?")) {
        return;
    }

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/chats/${chatId}`, {
            method: "DELETE",
            headers: {"Authorization": `Bearer ${token}`}
        })

        if (res.ok) {
            chatsData = chatsData.filter(chat => chat.id !== chatId);
            renderChatList(chatsData);

            if (currentChatId === chatId) {
                currentChatId = null;
                document.getElementById("chatTitle").textContent = "NEW CHAT";
                document.getElementById("messages").innerHTML = ""
                document.getElementById("userInput").disabled = true;
                document.getElementById("sendBtn").disabled = true;

                if (chatsData.length > 0) {
                    selectChat(chatsData[0].id, chatsData[0].title);
                }
            }
        }
    } catch (err) {
        console.error("Error deleting chat", err);
    }
}