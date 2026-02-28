const API = "http://localhost:3000"

async function login(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

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
        alert("Login failed" + (data.error || data.message));
    }
}

async function register(){
    const user_name = document.getElementById("userName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

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
        alert("Registered!")
        window.location.href = "ai_bot.html"
    } else {
        const errorData = await res.json()
        alert("Registration failed")
    }
}