/**
 * LocalStorage - Utility functions for working with browser's localStorage
 */

// Set an item in localStorage with optional expiration
export const setItem = (key, value, expirationInMinutes) => {
  const item = {
    value,
    timestamp: expirationInMinutes ? Date.now() : null,
    expiry: expirationInMinutes ? expirationInMinutes * 60 * 1000 : null,
  };
  
  localStorage.setItem(key, JSON.stringify(item));
};

// Get an item from localStorage, respecting expiration if present
export const getItem = (key) => {
  const itemStr = localStorage.getItem(key);
  
  if (!itemStr) {
    return null;
  }
  
  try {
    const item = JSON.parse(itemStr);
    
    // Check if item is expired
    if (item.expiry && item.timestamp) {
      const now = Date.now();
      if (now > item.timestamp + item.expiry) {
        // Item is expired, remove it
        localStorage.removeItem(key);
        return null;
      }
    }
    
    return item.value;
  } catch (error) {
    console.error('Error parsing localStorage item:', error);
    return null;
  }
};

// Remove an item from localStorage
export const removeItem = (key) => {
  localStorage.removeItem(key);
};

// Check if an item exists in localStorage
export const hasItem = (key) => {
  return getItem(key) !== null;
};

// Clear all items from localStorage
export const clearAll = () => {
  localStorage.clear();
};

// Clear items with specific prefix
export const clearWithPrefix = (prefix) => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
};

// User-specific utilities
export const UserStorage = {
  saveUser: (user, rememberMe = false) => {
    // If rememberMe is true, store for 30 days, otherwise session only (no expiration)
    const expiry = rememberMe ? 30 * 24 * 60 : null; // 30 days in minutes
    setItem('user', user, expiry);
  },
  
  getUser: () => {
    return getItem('user');
  },
  
  isLoggedIn: () => {
    return hasItem('user');
  },
  
  logout: () => {
    removeItem('user');
  }
};

export default {
  setItem,
  getItem,
  removeItem,
  hasItem,
  clearAll,
  clearWithPrefix,
  UserStorage
};