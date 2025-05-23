import React, { useState, useEffect } from 'react';
import { TodoAPI } from '../utils/ServerDB';
import { UserStorage } from '../utils/LocalStorage';
import styles from './TodoPage.module.css';

const TodoPage = () => {
  // States
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('id');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('title');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);

  // Get current user
  const userId = UserStorage.getUser()?.id;

  // Load todos
  useEffect(() => {
    loadTodos();
  }, [userId]);

  const loadTodos = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await TodoAPI.getByUser(userId);
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  // Sort todos
  const getSortedTodos = () => {
    const filtered = todos.filter(todo => {
      if (searchTerm === '') return true;
      
      switch (searchBy) {
        case 'id':
          return todo.id.toString().includes(searchTerm);
        case 'title':
          return todo.title.toLowerCase().includes(searchTerm.toLowerCase());
        case 'completed':
          return todo.completed.toString() === searchTerm.toLowerCase();
        default:
          return true;
      }
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'id':
          return a.id - b.id;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'completed':
          return (a.completed === b.completed) ? 0 : a.completed ? -1 : 1;
        default:
          return 0;
      }
    });
  };

  // Todo actions
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      const newTodo = await TodoAPI.create({
        userId,
        title: newTodoTitle,
        completed: false
      });
      setTodos(prev => [...prev, newTodo]);
      setNewTodoTitle('');
    } catch (err) {
      setError('Failed to add todo');
    }
  };

  const handleUpdateTodo = async (id, updates) => {
    try {
      const updatedTodo = await TodoAPI.update(id, updates);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
      setEditingTodo(null);
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await TodoAPI.delete(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Todo List</h1>

      {/* Search and Sort Controls */}
      <div className={styles.controls}>
        <div className={styles.search}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search todos..."
          />
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
          >
            <option value="id">By ID</option>
            <option value="title">By Title</option>
            <option value="completed">By Status</option>
          </select>
        </div>

        <div className={styles.sort}>
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="id">ID</option>
            <option value="title">Title</option>
            <option value="completed">Status</option>
          </select>
        </div>
      </div>

      {/* Add New Todo Form */}
      <form onSubmit={handleAddTodo} className={styles.addForm}>
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="New todo title..."
        />
        <button type="submit">Add Todo</button>
      </form>

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Loading Message */}
      {loading && <div className={styles.loading}>Loading...</div>}

      {/* Todos List */}
      <ul className={styles.todoList}>
        {getSortedTodos().map(todo => (
          <li key={todo.id} className={styles.todoItem}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleUpdateTodo(todo.id, {
                ...todo,
                completed: !todo.completed
              })}
            />
            
            {editingTodo?.id === todo.id ? (
              <input
                type="text"
                value={editingTodo.title}
                onChange={(e) => setEditingTodo({
                  ...editingTodo,
                  title: e.target.value
                })}
                onBlur={() => handleUpdateTodo(todo.id, editingTodo)}
                autoFocus
              />
            ) : (
              <span
                onClick={() => setEditingTodo(todo)}
                className={todo.completed ? styles.completed : ''}
              >
                {todo.title}
              </span>
            )}

            <div className={styles.todoId}>ID: {todo.id}</div>
            
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              className={styles.deleteBtn}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoPage;