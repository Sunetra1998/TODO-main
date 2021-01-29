const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
//const authMiddleWare = require("./authentication/authmiddleware");
const app = express();
app.use(express.json());
app.use(cors());
const userModel = require("./schema/userSchema");
const todoModel = require("./schema/todoSchema");
require("./db");
const nullOrUndefined = (value) => value == null || value == undefined;
const SALT = 5;

app.post("/signup", async (req, res) => {
  const { userName, password } = req.body;
  // const userName = req.body.userName;
  const existingUser = await userModel.findOne({ userName: userName });
  if (nullOrUndefined(existingUser)) {
    const hashedPwd = bcrypt.hashSync(password, SALT);
    const newUser = new userModel({ userName: userName, password: hashedPwd });
    await newUser.save();
    res.status(201).send({ success: "signed up successfully" });
  } else {
    res.status(400).send({ err: "UserName " + userName + " already exists" });
  }
});

app.post("/login", async (req, res) => {
  const { userName, password } = req.body;
  const existingUser = await userModel.findOne({ userName: userName });
  if (nullOrUndefined(existingUser)) {
    res.status(401).send({ err: "UserName doesnot exists" });
  } else {
    const hashedPwd = existingUser.password;
    if (bcrypt.compareSync(password, hashedPwd)) {
      res.status(200).send({ success: "logged in" });
    } else {
      res.status(401).send({ err: "Password is incorrect" });
    }
  }
});

const authMiddleWare = async (req, res, next) => {
  const userName = req.headers.username;
  const password = req.headers.password;
  if (nullOrUndefined(userName) || nullOrUndefined(password)) {
    res.status(401).send({ err: "incorrect userName or password" });
  } else {
    const existingUser = await userModel.findOne({
      userName,
    });

    if (nullOrUndefined(existingUser)) {
      res.status(401).send({ err: "Username doesnot exists" });
    } else {
      const hashedPwd = existingUser.password;
      if (bcrypt.compareSync(password, hashedPwd)) {
        req.user = existingUser;
        next();
      } else {
        res.status(401).send({ err: "Password is incorrect" });
      }
    }
  }
};

app.get("/todo", authMiddleWare, async (req, res) => {
  //const userId = req.user._id;
  const allTodos = await todoModel.find({ userId: req.user._id });
  res.send(allTodos);
});

app.post("/todo", authMiddleWare, async (req, res) => {
  const todo = req.body;
  (todo.creationTime = new Date()), (todo.done = false);
  todo.userId = req.user._id;
  const newTodo = new todoModel(todo);
  await newTodo.save();
  res.send(200).send(newTodo);
});

app.put("/todo/:todoId", authMiddleWare, async (req, res) => {
  const { task, userId } = req.body;
  const todoId = req.params.todoId;
  //const userId = req.user._id;
  console.log(userId);
  console.log(todoId);
  try {
    const todo = await todoModel.findOne({ _id: todoId });
    if (nullOrUndefined(todo)) {
      res.sendStatus(400);
    } else {
      (todo.task = task), (todo.userId = user._id);
      await todo.save();
      res.send(todo);
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
});

app.delete("/todo/:todoId", authMiddleWare, async (req, res) => {
  const todoId = req.params.todoId;

  try {
    await todoModel.deleteOne({ _id: todoId });
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(404);
  }
});

app.listen(8080);