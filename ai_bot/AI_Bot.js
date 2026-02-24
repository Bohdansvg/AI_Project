const API = "http://localhost:3000/api/chat"

if(!localStorage.getItem("token")){
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
    const input = document.getElementById("userInput");

    const text = input.value.trim();
    if (!text) return;

    addMessage(" " + text, "user");
    input.value = "";

    fetch(API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: text})
    })
        .then(res => res.json())
        .then(data => {
            addMessage(" " + data.reply, "ai");
        })
        .catch(() => {
            addMessage("AI error", "ai");
        });
}

// function formatMessage(text) {
//     return text.replace(/```([\s\S]*?)```/g, function (match, code) {
//         return `<pre><code>${code}</code></pre>`;
//     })
// }
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


