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
        window.location.href = "chat.html"
    } else {
        alert("Login failed")
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
        alert("Registered!")
        window.location.href = "login.html"
    } else {
        alert("Registration failed")
    }
}