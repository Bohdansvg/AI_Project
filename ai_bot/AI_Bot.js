const API = "http://localhost:3000/api"

if (!localStorage.getItem("token")) {
    window.location.href = "login.html"
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
    content.textContent = text;
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
    if(!currentChatId)  return;
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
        }
    })
        .then(res => res.json())
        .then(data => {
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
    window.location.href = "login.html";
}
document.addEventListener("DOMContentLoaded", loadChats)

async function  loadChats() {
    const token = localStorage.getItem("token");
    try{
        const res = await fetch(`${API}/chats`, {
            headers: {"Authorization": `Bearer ${token}`}
        })

        if (res.ok){
            const chats = await res.json();
            renderChatList(chats);

            if (chats.length > 0){
                selectChat(chats[0].id, chats[0].title);
            } else{
                createNewChat();
            }
        }
    } catch(err){
        console.error("Error loading chats", err);
    }

}

function renderChatList(chats) {
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";
    chats.forEach(chat => {
        const div = document.createElement("div");
        div.className = `chat-item ${chat.id === currentChatId ? "active" : ""}`;
        div.textContent = chat.title;
        div.onclick = () => selectChat(chat.id, chat.title);
        chatList.appendChild(div);
    })
}

async function createNewChat() {
    const token = localStorage.getItem("token");
    try{
        const res = await fetch(`${API}/chats`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({title: "New Chat"})
        })
        if (res.ok){
            const newChat = await res.json();
            selectChat(newChat.id, newChat.title);
            loadChats();
        }
    }catch(err){
        console.error("Error creating chat", err);
    }
}

async function selectChat(id, title) {
    currentChatId = id;
    document.getElementById("chatTitle").textContent = title;
    document.getElementById("messages").innerHTML = ""

    document.getElementById("userInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;

    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'))
    loadChats();

    const token = localStorage.getItem("token");
    try{
        const res = await fetch(`${API}/chats/${currentChatId}/messages`, {
            headers: {"Authorization": `Bearer ${token}`}
        })

        if (res.ok){
            const messages = await res.json();
            messages.forEach(msg => {
                addMessage(" " + msg.content, msg.role)
            })
        }


    } catch(err){
        console.error("Error loading history", err);
    }
}

