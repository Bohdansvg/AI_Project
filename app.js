const API = "/api"

let isLoginMode = false;

function toggleMode() {
    // function toggleMode(e) {
    // if (e) e.preventDefault();
    isLoginMode = !isLoginMode;

    const container = document.getElementById("authContainer");
    const title = document.getElementById("authTitle");
    const btn = document.getElementById("authBtn");
    const toggleText = document.getElementById("toggleText");

    if (isLoginMode) {
        container.classList.add("login-mode");
        title.textContent = "Sign In";
        btn.textContent = "Login";
        // toggleText.innerHTML = `Don't have an account? <a href="#" onclick="toggleMode(event)">Register</a>`;
        toggleText.innerHTML = `Don't have an account? <a href="#" onclick="toggleMode(); return false;">Register</a>`;
    } else {
        container.classList.remove("login-mode");
        title.textContent = "Create Account";
        btn.textContent = "Register";
        // toggleText.innerHTML = `Already have an account? <a href="#" onclick="toggleMode(event)">Login</a>`;
        toggleText.innerHTML = `Already have an account? <a href="#" onclick="toggleMode(); return false;">Login</a>`;
    }
}

async function handleSubmit() {
    if (isLoginMode) {
        await login();
    } else {
        await register();
    }
}

async function login(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) return alert("Please fill all fields");

    const res = await fetch(API + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({email, password})
    })
    const data = await res.json()

    if(res.ok){
        localStorage.setItem("token", data.token)
        window.location.href = "ai_bot.html"
    } else {
        alert("Login failed: " + (data.error || data.message));
    }
}

async function register(){
    const user_name = document.getElementById("userName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!user_name || !email || !password) return alert("Please fill all fields");

    const res = await fetch(API + "/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({user_name,email, password})
    })

    if(res.ok){
        const data = await res.json()
        localStorage.setItem("token", data.token)
        alert("Registered successfully!")
        window.location.href = "ai_bot.html"
    } else {
        const errorData = await res.json()
        alert("Registration failed: " + (errorData.error || errorData.message));
    }
}