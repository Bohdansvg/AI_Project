const API = "/api"
let currentChatId = null;
let chatsData = []
let attachedFiles = []

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
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", function () {
        const files = Array.from(fileInput.files)
        files.forEach(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        const MAX = 1024;
                        let {width, height} = img;
                        if (width > MAX || height > MAX) {
                            if (width > height) {
                                height = Math.round(height * MAX / width);
                                width = MAX;
                            } else {
                                width = Math.round(width * MAX / height);
                                height = MAX;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        const compressed = canvas.toDataURL('image/jpeg', 0.85);
                        const base64data = compressed.split(',')[1];
                        attachedFiles.push({
                            name: file.name,
                            mimeType: 'image/jpeg',
                            content: base64data,
                            isImage: true
                        });
                        updateAttachPreview();
                    };
                    img.src = e.target.result;
                }
                reader.readAsDataURL(file);
            } else if (ext === 'docx') {
                const reader = new FileReader();
                reader.onload = function (e) {
                    mammoth.extractRawText({arrayBuffer: e.target.result})
                        .then(result => {
                            attachedFiles.push({name: file.name, content: result.value});
                            updateAttachPreview();
                        })
                        .catch(() => {
                            attachedFiles.push({name: file.name, content: '[Не вдалося прочитати .docx файл]'});
                            updateAttachPreview();
                        });
                }
                reader.readAsArrayBuffer(file);
            } else if (['xls', 'xlsx', 'doc'].includes(ext)) {
                attachedFiles.push({
                    name: file.name,
                    content: `[Файл формату .${ext} не підтримується для читання тексту]`
                });
                updateAttachPreview();
            } else {
                const reader = new FileReader();
                reader.onload = function (e) {
                    attachedFiles.push({name: file.name, content: e.target.result});
                    updateAttachPreview();
                }
                reader.readAsText(file);
            }
        })
        fileInput.value = "";
    })
})


function updateAttachPreview() {
    const preview = document.getElementById("attachPreview")
    if (!preview) return

    preview.innerHTML = "";
    attachedFiles.forEach((f, i) => {
        const tag = document.createElement("div");

        const rm = document.createElement("button");
        rm.textContent = "×";
        rm.className = "attach-tag-remove";
        rm.onclick = () => {
            attachedFiles.splice(i, 1);
            updateAttachPreview();
        }

        if (f.isImage) {
            tag.className = "attach-tag attach-tag--image";
            const thumb = document.createElement("img");
            thumb.src = `data:${f.mimeType};base64,${f.content}`;
            tag.appendChild(thumb);
        } else {
            tag.className = "attach-tag attach-tag--file";

            const iconDiv = document.createElement("div");
            iconDiv.className = "attach_tag_icon"
            iconDiv.innerHTML = `<svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2H6a2 2 0 00-2 2v36a2 2 0 002 2h24a2 2 0 002-2V12L22 2z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
                <path d="M22 2v8a2 2 0 002 2h8" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="9" y1="21" x2="27" y2="21" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="9" y1="27" x2="27" y2="27" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="9" y1="33" x2="19" y2="33" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`;

            const info = document.createElement("div");
            info.className = "attach-tag-info";

            // const name = document.createElement("span");
            // name.className = "attach-tag-name";
            // name.textContent = f.name;

            const ext = document.createElement("span");
            ext.className = "attach-tag-ext";
            ext.textContent = f.name.split('.').pop().toUpperCase();

            // info.appendChild(name);
            info.appendChild(ext);
            tag.appendChild(iconDiv);
            tag.appendChild(info);

        }
        tag.appendChild(rm);
        preview.appendChild(tag);
    })
    preview.style.display = attachedFiles.length > 0 ? "flex" : "none";
}


function addMessage(text, type, images = []) {
    const messageContainer = document.getElementById("messages");
    const row = document.createElement("div");
    row.className = "message-row " + type;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = type === "user" ? "U" : " ";

    const content = document.createElement("div");
    content.className = "message-content";


    if (images.length > 0) {
        const imgGrid = document.createElement("div");
        imgGrid.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: ${text.trim() ? '8px' : '0'};
        `;
        images.forEach(img => {
            const wrapper = document.createElement("div");
            wrapper.style.cssText = `
                position: relative;
                width: 80px;
                height: 80px;
                border-radius: 10px;
                overflow: hidden;
                flex-shrink: 0;
                border: 1px solid rgba(255,255,255,0.2);
                cursor: pointer;
            `;
            const imgEl = document.createElement("img");
            imgEl.src = `data:${img.mimeType};base64,${img.content || img.data}`;
            imgEl.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            `;

            imgEl.addEventListener("click", () => {
                const overlay = document.createElement("div");
                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    cursor: zoom-out;
                `;
                const fullImg = document.createElement("img");
                fullImg.src = imgEl.src;
                fullImg.style.cssText = `
                    max-width: 90vw;
                    max-height: 90vh;
                    border-radius: 12px;
                    object-fit: contain;
                `;
                overlay.appendChild(fullImg);
                overlay.addEventListener("click", () => overlay.remove());
                document.body.appendChild(overlay);
            });
            wrapper.appendChild(imgEl);
            imgGrid.appendChild(wrapper);
        });
        content.appendChild(imgGrid);
    }


    if (text.trim()) {
        const textDiv = document.createElement("div");
        textDiv.innerHTML = formatMessage(text);
        content.appendChild(textDiv);
    }


    const copyBtn = document.createElement("button");
    copyBtn.className = "copy";
    copyBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.style.opacity = "0.5";
            setTimeout(() => {
                copyBtn.style.opacity = "1";
            }, 500);
        });
    });
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
    if (!text && attachedFiles.length === 0) return;

    let fullMessage = text;
    let images = [];

    if (attachedFiles.length > 0) {
        const textFiles = attachedFiles.filter(f => !f.isImage);
        images = attachedFiles.filter(f => f.isImage);

        if (textFiles.length > 0) {
            const filesText = textFiles.map(f => `\n\n---File: ${f.name} ---\n${f.content}`).join("");
            fullMessage = text + filesText;
        }

        attachedFiles = [];
        updateAttachPreview();
    }

    addMessage(" " + fullMessage, "user", images);
    input.value = "";

    fetch(`${API}/chats/${currentChatId}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
            message: fullMessage,
            images: images.map(img => ({mimeType: img.mimeType, data: img.content}))
        })
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

document.addEventListener("DOMContentLoaded", () => {
    Theme()
    loadChats()
})

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
        deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 14" class="svgIcon bin-top">
        <g clip-path="url(#clip0_35_24)">
            <path fill="currentColor" d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734Z"></path>
        </g>
        <defs><clipPath id="clip0_35_24"><rect fill="white" height="14" width="69"></rect></clipPath></defs>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 57" class="svgIcon bin-bottom">
        <g clip-path="url(#clip0_35_22)">
            <path fill="currentColor" d="M64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"></path>
        </g>
        <defs><clipPath id="clip0_35_22"><rect fill="white" height="57" width="69"></rect></clipPath></defs>
    </svg>
`;
        deleteBtn.onclick = (e) => deleteChat(chat.id, e)
        div.appendChild(titleSpan);
        div.appendChild(deleteBtn);
        div.onclick = () => selectChat(chat.id, chat.title);
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
            selectChat(newChat.id, newChat.title);
            renderChatList(chatsData);
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
    document.getElementById("attachBtn").disabled = false;

    document.querySelectorAll('.chat-item').forEach(el => {
        el.classList.toggle('active', el.textContent === title);
    })

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/chats/${currentChatId}/messages`, {
            headers: {"Authorization": `Bearer ${token}`}
        })

        if (res.ok) {
            const messages = await res.json();
            messages.forEach(msg => {
                addMessage(" " + msg.content, msg.role, msg.images || [])
            })
        }


    } catch (err) {
        console.error("Error loading history", err);
    }
}

function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("active")
}

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode")
    localStorage.setItem("theme", isDark ? "dark" : "light")
}

function Theme() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        const toggle = document.getElementById("themeToggle");
        if (toggle) toggle.checked = true;
    }
}

async function deleteChat(chatId, event) {
    event.stopPropagation();

    // if (!confirm("Are you sure you want to delete this chat?")) {
    //     return;
    // }

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
                document.getElementById("chatTitle").textContent = "Select a chat";
                document.getElementById("messages").innerHTML = ""
                document.getElementById("userInput").disabled = true;
                document.getElementById("sendBtn").disabled = true;
                document.getElementById("attachBtn").disabled = true;

                if (chatsData.length > 0) {
                    selectChat(chatsData[0].id, chatsData[0].title);
                }
            }
        }
    } catch (err) {
        console.error("Error deleting chat", err);
    }

}


document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById('sendBtn');
    if (!btn) return;


    btn.innerHTML = `
        <div class="svg-wrapper-1">
            <div class="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
                </svg>
            </div>
        </div>
        <span>Send</span>
    `;


    const style = document.createElement('style');
    style.textContent = `
        #sendBtn {
            font-family: 'Syne', sans-serif;
            font-size: 15px;
            font-weight: 600;
            background: #2b7fff;
            color: white;
            padding: 0.6em 1em;
            padding-left: 0.9em;
            display: flex;
            align-items: center;
            border: none;
            border-radius: 14px;
            overflow: hidden;
            transition: all 0.2s;
            cursor: pointer;
            height: auto;
            width: auto;
            min-width: 0;
            box-shadow: 0 4px 18px rgba(43,127,255,0.35);
            flex-shrink: 0;
        }

        #sendBtn:hover:not(:disabled) {
            background: #1a6ef0;
            box-shadow: 0 6px 24px rgba(43,127,255,0.50);
        }

        #sendBtn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        #sendBtn span {
            display: block;
            margin-left: 0.3em;
            transition: all 0.3s ease-in-out;
        }

        #sendBtn svg {
            display: block;
            transform-origin: center center;
            transition: transform 0.3s ease-in-out;
        }

        #sendBtn .svg-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #sendBtn:hover:not(:disabled) .svg-wrapper {
            animation: fly-1 0.6s ease-in-out infinite alternate;
        }

        #sendBtn:hover:not(:disabled) svg {
            transform: translateX(0.3em) rotate(45deg) scale(1.1);
        }

        #sendBtn:hover:not(:disabled) span {
            transform: translateX(0.3em);
        }

        #sendBtn:active:not(:disabled) {
            transform: scale(0.95);
        }

        @keyframes fly-1 {
            from { transform: translateY(0.1em); }
            to   { transform: translateY(-0.1em); }
        }

       
        #sendBtn canvas,
        #metalCanvas {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
});

document.getElementById('userInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});