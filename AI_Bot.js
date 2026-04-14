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
                        let { width, height } = img;
                        if (width > MAX || height > MAX) {
                            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
                            else { width = Math.round(width * MAX / height); height = MAX; }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        const compressed = canvas.toDataURL('image/jpeg', 0.85);
                        const base64data = compressed.split(',')[1];
                        attachedFiles.push({ name: file.name, mimeType: 'image/jpeg', content: base64data, isImage: true });
                        updateAttachPreview();
                    };
                    img.src = e.target.result;
                }
                reader.readAsDataURL(file);
            } else if (ext === 'docx') {
                const reader = new FileReader();
                reader.onload = function (e) {
                    mammoth.extractRawText({ arrayBuffer: e.target.result })
                        .then(result => {
                            attachedFiles.push({ name: file.name, content: result.value });
                            updateAttachPreview();
                        })
                        .catch(() => {
                            attachedFiles.push({ name: file.name, content: '[Не вдалося прочитати .docx файл]' });
                            updateAttachPreview();
                        });
                }
                reader.readAsArrayBuffer(file);
            } else if (['pdf', 'xls', 'xlsx', 'doc'].includes(ext)) {
                attachedFiles.push({ name: file.name, content: `[Файл формату .${ext} не підтримується для читання тексту]` });
                updateAttachPreview();
            } else {
                const reader = new FileReader();
                reader.onload = function (e) {
                    attachedFiles.push({ name: file.name, content: e.target.result });
                    updateAttachPreview();
                }
                reader.readAsText(file);
            }
        })
        fileInput.value = "";
    })
})

function updateAttachPreview() {
    let preview = document.getElementById("attachPreview")
    if(!preview) {
        preview = document.createElement("div");
        preview.id = "attachPreview";
        preview.className = "attachPreview";
        const inputArea = document.querySelector(".input")
        inputArea.insertBefore(preview, inputArea.querySelector("#userInput"))
    }
    preview.innerHTML = "";
    attachedFiles.forEach((f, i) => {
        const tag = document.createElement("span");
        tag.className = "attach-tag"
        tag.textContent = f.name;
        const rm = document.createElement("button");
        rm.textContent = "x"
        rm.onclick= () => { attachedFiles.splice(i, 1); updateAttachPreview(); }
        tag.appendChild(rm)
        preview.appendChild(rm)
    })
    if (attachedFiles.length === 0 && preview.parentNode){
        preview.parentNode.removeChild(preview)
    }
}


function addMessage(text, type, images = []) {
    const messageContainer = document.getElementById("messages");
    const row = document.createElement("div");
    row.className = "message-row " + type;
    const avatar = document.createElement("div")
    avatar.className = "avatar";
    avatar.textContent = type === "user" ? "U" : " ";
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = formatMessage(text)

    images.forEach(img => {
        const imgEl = document.createElement("img");
        imgEl.src = `data:${img.mimeType};base64,${img.content}`;
        imgEl.style.cssText = "max-width:220px;max-height:220px;border-radius:8px;display:block;margin-top:6px;";
        content.appendChild(imgEl);
    });

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
    if (!text && attachedFiles.length ===0 ) return;

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
            images: images.map(img => ({ mimeType: img.mimeType, data: img.content }))
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
        deleteBtn.innerHTML = `<img src="remove.png" alt="delete" style="width: 16px; height: 16px; background-color: transparent;">`
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
                addMessage(" " + msg.content, msg.role, msg.animationFillMode || [])
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
    const canvas = document.getElementById('metalCanvas');
    const btn = document.getElementById('sendBtn');
    if (!canvas || !btn) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const S = 96;
    canvas.width = S;
    canvas.height = S;

    const vs = `attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
    const fs = `
    precision highp float;
    uniform float u_t,u_h;
    uniform vec2 u_r;
    float hash(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=.5;}return v;}
    void main(){
      vec2 uv=(gl_FragCoord.xy/u_r)*2.-1.;
      float d=length(uv);if(d>1.){gl_FragColor=vec4(0);return;}
      float t=u_t*(.4+u_h*.6);
      vec2 p=uv*1.5+vec2(t*.2,t*.12);
      float f=fbm(p+fbm(p+fbm(p)));
vec3 dark  = vec3(.01,.01,.02);
      vec3 mid   = vec3(.22,.24,.30);
      vec3 light = vec3(.45,.48,.58);

      vec3 c = mix(dark, mid, f);
      c = mix(c, light, pow(f, 2.5) * (.4 + u_h * .3));

     
      float center = pow(max(0., 1. - d * 1.5), 2.0);
      c = mix(c, dark, center * .6);

     
      float rim = pow(smoothstep(.55, 1., d), 1.8);
      vec3 rimColor = mix(
        vec3(.55,.65,.90),   /* синювато-холодний */
        vec3(.90,.95,1.00),  /* майже білий */
        u_h                  /* на hover — біліший */
      );
      c += rimColor * rim * (1.2 + u_h * .8);

     
      float edge = pow(smoothstep(.80, 1., d), 3.5);
      c += vec3(.70,.80,1.0) * edge * (1.5 + u_h * 1.0);

      c = mix(c, vec3(0.), smoothstep(.96, 1., d));
      c = pow(c, vec3(1.15));

      gl_FragColor=vec4(c,1.);
    }`;

    const mk = (src, t) => {
        const s = gl.createShader(t);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(vs, gl.VERTEX_SHADER));
    gl.attachShader(prog, mk(fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, 'u_t'),
        uR = gl.getUniformLocation(prog, 'u_r'),
        uH = gl.getUniformLocation(prog, 'u_h');

    let hover = 0, target = 0, t0 = null;
    btn.addEventListener('mouseenter', () => target = 1);
    btn.addEventListener('mouseleave', () => target = 0);

    (function frame(ts) {
        if (!t0) t0 = ts;
        hover += (target - hover) * 0.09;
        gl.viewport(0, 0, S, S);
        gl.uniform1f(uT, (ts - t0) / 1000);
        gl.uniform2f(uR, S, S);
        gl.uniform1f(uH, hover);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(frame);
    })(0);
});