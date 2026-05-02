const API = "/api"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
let isLoginMode = false;

window.addEventListener('load', () => {
    if(typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn
        })
    }
})

function signInWithGoogle(){
    if(typeof google === "undefined") {
        return alert("Google Sign In dont work connection")
    }
    google.accounts.id.prompt()
}

function toggleMode(e) {
    if (e) e.preventDefault();
    isLoginMode = !isLoginMode;

    const container = document.getElementById("authContainer");
    const brandSub = document.getElementById("brandSub");
    const btnText = document.getElementById("btnText");
    const toggleText = document.getElementById("toggleText");
    const toggleText1 = document.getElementById("toggleText1");
    const userNameWrapper = document.getElementById("userNameWrapper");

    if (isLoginMode) {

        container.classList.add("login-mode");
        brandSub.textContent = "Welcome back!";
        btnText.textContent = "Sign In";
        toggleText.style.display = "none";
        toggleText1.style.display = "block";
    } else {

        container.classList.remove("login-mode");
        brandSub.textContent = "Create your account to get started";
        btnText.textContent = "Create Account";
        toggleText.style.display = "block";
        toggleText1.style.display = "none";
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