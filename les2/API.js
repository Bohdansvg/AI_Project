const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let students = [
    {id: 1, name: "Artem", age: 20},
    {id: 2,name: "Bogdan", age: 20},
];

let nextId = 3

app.get("/api/students", (req, res) => {
    res.json(students);
});

app.get("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({message: "No such student"});
    }

    res.json(student);
})

// app.post("api/students", (req, res) => {
//     students.push(req.body);
//     res.status(201).json(req.body);
// })

app.post("/api/students", (req, res) => {
    const {name, age} = req.body;

    if (!name || typeof age !== "number"){
        return res.status(400).json({message: "Invalid data"});
    }

    const  newStudent = {
        id: nextId++,
        name,
        age
    };
    students.push(newStudent);
    res.status(201).json(newStudent);
});


app.delete("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    students = students.filter(s => s.id !== id);
    res.sendStatus(200);
})
app.put("/api/students/:id", (req, res) => {
    const id = parseInt(req.params.id); // Використовуй parseInt для надійності
    const { name, age } = req.body;

    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({ message: `Студента з ID ${id} не знайдено` });
    }

    if (name !== undefined) student.name = name;
    if (age !== undefined) student.age = Number(age);

    console.log("Студент оновлений:", student);
    res.json(student);
});

app.patch("/api/students/:id", (req, res) => {
    const id = Number(req.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).json({ message: "No such student" });
    }

    if (req.body.name) student.name = req.body.name;
    if (req.body.age) student.age = Number(req.body.age);

    res.json(student);
});
app.listen(3000, () => {
    console.log("Server started on port 3000");
})
