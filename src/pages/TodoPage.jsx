import React, { useState, useEffect } from 'react';
import { TodoAPI } from '../utils/ServerDB';
import { UserStorage } from '../utils/LocalStorage';
// Add Material-UI imports
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

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
  <Container maxWidth="md">
    <Paper 
      elevation={3} 
      sx={{ p: 3, mt: 3 }}
    >
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Todo List
      </Typography>

      {/* Search and Sort Controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3 
        }}
      >
<TextField
  size="small"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search todos..."
  sx={{
    flexGrow: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      paddingY: '0',
      '& input': {
        paddingY: '0.6rem',
        paddingX: '1rem',
        fontSize: '1rem',
        lineHeight: 1.5,
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  }}
  variant="outlined"
/>

        
        {/* Search By Dropdown */}
        <FormControl 
          size="small" 
          sx={{ minWidth: 120 }}
        >
          <InputLabel>Search By</InputLabel>
          <Select
            value={searchBy}
            label="Search By"
            onChange={(e) => setSearchBy(e.target.value)}
          >
            <MenuItem value="id">ID</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="completed">Status</MenuItem>
          </Select>
        </FormControl>

        {/* Sort By Dropdown */}
        <FormControl 
          size="small" 
          sx={{ minWidth: 120 }}
        >
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="id">ID</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="completed">Status</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Add New Todo Form */}
      <Box 
        component="form" 
        onSubmit={handleAddTodo} 
        sx={{ mb: 3 }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
                fullWidth
                size="small"
                label="New Todo"
                placeholder="New todo title..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                variant="outlined"
                sx={{
                    '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    paddingY: '0', // reset vertical padding on container
                    '& input': {
                        paddingY: '0.6rem',  // vertical padding on input
                        paddingX: '1rem',    // horizontal padding
                        fontSize: '1rem',
                        lineHeight: 1.5,
                    },
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                    },
                }}
                />



          <Button
            type="submit"
            variant="contained"
            color="primary"
          >
            Add Todo
          </Button>
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading Spinner */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Todos List */}
      <List>
        {getSortedTodos().map(todo => (
          <ListItem
            key={todo.id}
            sx={{
              borderBottom: '1px solid #eee',
              '&:last-child': { borderBottom: 'none' }
            }}
          >
            <Checkbox
              checked={todo.completed}
              onChange={() => handleUpdateTodo(todo.id, {
                ...todo,
                completed: !todo.completed
              })}
            />
            
            {editingTodo?.id === todo.id ? (
             <TextField
                fullWidth
                size="small"
                value={editingTodo.title}
                onChange={(e) => setEditingTodo({
                  ...editingTodo,
                  title: e.target.value
                })}
                onBlur={() => handleUpdateTodo(todo.id, editingTodo)}
                autoFocus
              />
            ) : (
              <ListItemText
                primary={todo.title}
                sx={{
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? 'text.secondary' : 'text.primary'
                }}
              />
            )}

            <Box component="span">
              <Typography 
                variant="caption" 
                sx={{ mr: 2, color: 'text.secondary' }}
              >
                ID: {todo.id}
              </Typography>
              <IconButton
                edge="end"
                onClick={() => setEditingTodo(todo)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                onClick={() => handleDeleteTodo(todo.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  </Container>
);
};
export default TodoPage;