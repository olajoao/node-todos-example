const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username)

  if(!user) {
    return response.status(400).json({ error: "User not found"})
  }

  request.user = user;
  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const userAlreadyExist = users.some((user) => user.username === username);

  if(userAlreadyExist) {
    return response.status(400).json({ error: "User already exists!"});
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser);
  return response.status(201).json(newUser);
});

app.get('/users', (_, response) => {
  return response.status(200).json(users)
})

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const todos = user.todos;
  return response.status(200).json(todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo)
  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { user } = request;
  const { title, deadline } = request.body;

  const todoIndex = user.todos.findIndex((todo) => todo.id === todoId);

  if(todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found!"});
  }

  const todo = user.todos[todoIndex];
  const updatedTodo = {
    done: false,
    title,
    deadline: new Date(deadline),
  }

  user.todos[todoIndex] = {
    ...todo,
    ...updatedTodo
  };

  return response.status(200).json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { user } = request;

  const todoIndex = user.todos.findIndex((todo) => todo.id === todoId);

  if(todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found!"});
  }

  const todo = user.todos[todoIndex];
  const updatedTodo = {
    ...todo,
    done: true,
  }

  user.todos[todoIndex] = updatedTodo;
  return response.status(200).json(updatedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id: todoId } = request.params;
  const { user } = request;
  
  const todoIndex = user.todos.findIndex((todo) => todo.id === todoId);

  if(todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found!"});
  }

  const todo = user.todos[todoIndex];
  user.todos.splice(todo, 1)

  return response.status(204).json({ message: "Todo deleted successfully"});
});

module.exports = app;