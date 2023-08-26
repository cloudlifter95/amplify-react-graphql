import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from '@aws-amplify/ui-react';
import { listTodos } from "./graphql/queries";
import {
  createTodo as createTodoMutation,
  deleteTodo as deleteTodoMutation,
} from "./graphql/mutations";

const App = ({ signOut }) => {
  const [Todos, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const apiData = await API.graphql({ query: listTodos });
    const TodosFromAPI = apiData.data.listTodos.items;
    await Promise.all(
      TodosFromAPI.map(async (todo) => {
        if (todo.image) {
          const url = await Storage.get(todo.name);
          todo.image = url;
        }
        return todo;
      })
    );
    setTodos(TodosFromAPI);
  }

  async function createTodo(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
      
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createTodoMutation,
      variables: { input: data },
    });
    fetchTodos();
    event.target.reset();
  }

  async function deleteTodo({ id, name }) {
    const newTodos = Todos.filter((Todo) => Todo.id !== id);
    setTodos(newTodos);
    await Storage.remove(name);
    await API.graphql({
      query: deleteTodoMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>My Todos App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createTodo}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Todo Name"
            label="Todo Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Todo Description"
            label="Todo Description"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />
          <Button type="submit" variation="primary">
            Create Todo
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Todos</Heading>
      <View margin="3rem 0">
        {Todos.map((Todo) => (
          <Flex
            key={Todo.id || Todo.name}
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Text as="strong" fontWeight={700}>
              {Todo.name}
            </Text>
            <Text as="span">{Todo.description}</Text>
            {Todo.image && (
              <Image
                src={Todo.image}
                alt={`Visual aid for ${Todo.name}`}
                style={{ width: 400 }}
              />
            )}
            <Button variation="link" onClick={() => deleteTodo(Todo)}>
              Delete Todo
            </Button>
          </Flex>
        ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);