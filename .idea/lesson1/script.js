// const button = document.getElementById('btn')
//
// button.addEventListener('click', () => {
//     console.log('clicked')
// })
//
// function button1() {
//     console.log("clicked")
// }
//
// button1()
//
// let number = 10 // -> can be like int, double, float
// let text = "Hello World!"// -> string -> text
// let isReady = true //-> boolean type
// let nothing = null;
// let undef;
//
// document.getElementById("head")// -> one element
// document.querySelector(".head")// ->one element
// document.querySelector("#head")// -> one element
// document.querySelectorAll("#head") // -> all elements
//
// element.textContent = "Hello World!"
// element.innerHTMl = "<b>Hello World!</b>"
//
// element.style.color = "red"
// element.style.backgroundColor = "red"
// element.style.fontSize = "12px"
//
// let age = 16
// if (age >= 18) {
//     console.log("Adult")
// } else {
//     console.log("Kid")
// }

// const ageInput = document.getElementById("age");
// const button = document.getElementById("btn");
// const result = document.getElementById("result");
//
// button.addEventListener("click", () => {
//     if (ageInput.value >= 18){
//         result.textContent = "Adult"
//     }else{
//         result.textContent = "Kid";
//     }
// })

function greetings() {
    const nameInput = document.getElementById("name")
    const btn = document.getElementById("button");
    const res = document.getElementById('result2');

    btn.addEventListener('click', () => {
        let name = nameInput.value;
        if (name === "") {
            let text = "Enter your name";
            res.style.color = "red"
            res.textContent = text;
            return;
        }
        let text = "Welcome " + name + "!";
        res.textContent = text
        res.style.color = "green"
    })
}

greetings();

function resume() {
    const nameInput = document.getElementById("name2")
    const ageInput = document.getElementById("age")
    const emailInput = document.getElementById("email")
    const skillsInput = document.getElementById("skills")
    const btn = document.getElementById("button2")
    const res = document.getElementById('result3');

    btn.addEventListener('click', () => {

        let name = nameInput.value;
        if (name === "") {
            let text = "Enter your name"
            res.textContent = text;
            res.style.color = "red"
            return;
        }
        let age = ageInput.value;
        if (age === "") {
            let text = "Enter your age"
            res.textContent = text;
            res.style.color = "red"
            return;
        }
        let email = emailInput.value;
        if (email === "") {
            let text = "Enter your email"
            res.textContent = text;
            res.style.color = "red"
            return;
        }

        let skills = skillsInput.value;
        if (skills === "") {
            let text = "Enter your skills"
            res.textContent = text;
            res.style.color = "red"
            return;
        }
        let text = "Success registration !";
        res.textContent = text;
        res.style.color = "green"

        let text1 = "Name: " + name + " " + " Age: " + age + "  " + "Email:" + email + "  " + " Skills" + skills + "\n";
        res.textContent = text1;


    })
}

resume();



