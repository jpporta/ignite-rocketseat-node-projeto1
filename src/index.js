const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  // no username in header
  if (!username)
    return response
      .status(400)
      .json({ error: "username header must be specified" });
  // find user
  const user = users.find((o) => o.username === username);
  // user not found
  if (!user) return response.status(404).json({ error: "User not found" });
  // user found
  request.user = user;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyTaken = users.some((o) => o.username === username);

  if (userAlreadyTaken) {
    return response.status(400).json({ error: "User name already taken!" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  // return todos of users
  return response.status(200).json(request.user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  // required fields in body
  if (!title || !deadline)
    return response
      .status(400)
      .json({ error: "Title and deadline are required in body" });
  // required fields in body
  const userIndex = users.findIndex((o) => o.id === request.user.id);
  // create todo
  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  // insert into array
  users[userIndex].todos.push(todo);

  // success return
  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  // required fields in body
  if (!title || !deadline)
    return response
      .status(400)
      .json({ error: "Title and deadline are required in body" });
  // user index
  const userIndex = users.findIndex((o) => o.id === request.user.id);
  // todo index
  const todoIndex = request.user.todos.findIndex(
    (o) => o.id === request.params.id
  );
  // todo not found
  if (todoIndex === -1)
    return response.status(404).json({ error: "Todo not found" });
  // alter registry
  users[userIndex].todos[todoIndex].title = title;
  users[userIndex].todos[todoIndex].deadline = deadline;

  return response.status(202).json(users[userIndex].todos[todoIndex]);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const userIndex = users.findIndex((o) => o.id === request.user.id);
  // todo index
  const todoIndex = request.user.todos.findIndex(
    (o) => o.id === request.params.id
  );
  // todo not found
  if (todoIndex === -1)
    return response.status(404).json({ error: "Todo not found" });
  // alter registry
  users[userIndex].todos[todoIndex].done = true;

  return response.status(202).json(users[userIndex].todos[todoIndex]);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const userIndex = users.findIndex((o) => o.id === request.user.id);
  // todo index
  const todoIndex = request.user.todos.findIndex(
    (o) => o.id === request.params.id
  );
  // todo not found
  if (todoIndex === -1)
    return response.status(404).json({ error: "Todo not found" });
  // alter registry
  users[userIndex].todos.splice(todoIndex, 1);

  return response.sendStatus(204);
});

module.exports = app;
