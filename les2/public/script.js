const API = "http://localhost:3000/api/students";

function loadStudents() {
    fetch(API)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("list");
            list.innerHTML = "";

            data.forEach(s => {
                const li = document.createElement("li");
                //li.textContent = `${s.id}: ${s.name} (${s.age})`;
                li.textContent = "ID: " + s.id + " Name: " + s.name + "  Age: " + s.age + "\n";
                // li.style.color = "white"
                list.appendChild(li);
            })
        })
}

function addStudent() {
    const name = prompt("Enter name of student")
    if (!name || name.trim() === "") {
        alert("Enter student name");
        return;
    }
        loadStudents()
    const age = prompt("Enter age of student")
    if (!age || isNaN(age)) {
        alert("Enter student age");
        return;
    }
    fetch(API,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({name: name.trim(), age: Number(age)})
        })
        .then(res => res.json())
        .then(() => loadStudents());
    // .catch(err => console.error("Error: ", err));
}

function deleteStudent() {
    const id = prompt("Enter id of student")
    if (!id) {
        alert("Enter id of student");
        return;
    }
        loadStudents()
    fetch(API + "/" + id,
        {
            method: "DELETE",
        })
        .then(res => res.json())
        .then(() => loadStudents()
        )
}

function putStudent() {
    const id = prompt("Enter id of student");
    if (!id) return;

    const name = prompt("Enter new name:");
    const age = prompt("Enter new age:");

    const body = {};
    if (name) body.name = name.trim();
    if (age) body.age = Number(age);

    console.log("Відправляю дані:", body);

    fetch(`${API}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(res => {
            console.log("Статус відповіді:", res.status);
            if (!res.ok) return res.json().then(err => { throw err });
            return res.json();
        })
        .then(data => {
            console.log("Сервер повернув оновленого студента:", data);
            loadStudents();
        })
        .catch(err => {
            console.error("Помилка PUT:", err);
            alert("Помилка: " + (err.message || "Не вдалося оновити"));
        });
}

function patchStudent() {
    const id = prompt("Enter id of student")
    if (!id) {
        alert("Enter id of student");
        return;
    }

    const name = prompt("Enter new name (or leave empty):");
    const age = prompt("Enter new age (or leave empty):");

    const updatedData = {};
    if (name && name.trim() !== "") updatedData.name = name.trim();
    if (age && age.trim() !== "") updatedData.age = Number(age);

    fetch(API + "/" + id,
        {
            method: "PATCH",
            headers:{
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)

        })
        .then(res => res.json())
        .then(() => loadStudents()
        )
}