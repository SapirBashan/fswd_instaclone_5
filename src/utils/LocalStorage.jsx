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

// Cookie handling utilities
const setCookie = (name, value, minutesToExpire = null) => {
  let cookieString = `${name}=${encodeURIComponent(value)}; path=/`;
  
  if (minutesToExpire) {
    const date = new Date();
    date.setTime(date.getTime() + (minutesToExpire * 60 * 1000));
    cookieString += `; expires=${date.toUTCString()}`;
  }
  
  document.cookie = cookieString;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
};

const removeCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

// User-specific utilities
export const UserStorage = {
  saveUser: (userData, rememberMe = false) => {
    // Store username in cookie
    const expiry = rememberMe ? 30 * 24 * 60 : null; // 30 days in minutes
    setCookie('current_user', userData.username, expiry);
    
    // Store user data in localStorage
    const userKey = `user_${userData.username}`;
    setItem(userKey, userData, expiry);
  },
  
  getCurrentUsername: () => {
    return getCookie('current_user');
  },
  
  getUser: () => {
    const username = getCookie('current_user');
    if (!username) return null;
    
    const userKey = `user_${username}`;
    return getItem(userKey);
  },
  
  isLoggedIn: () => {
    const username = getCookie('current_user');
    if (!username) return false;
    
    const userKey = `user_${username}`;
    return hasItem(userKey);
  },
  
  logout: () => {
    const username = getCookie('current_user');
    if (username) {
      // Set user data to expire in 20 minutes
      const userKey = `user_${username}`;
      const userData = getItem(userKey);
      if (userData) {
        setItem(userKey, userData, 20);
      }
      
      // Remove the cookie immediately
      removeCookie('current_user');
    }
  },
  
  // Get all stored users
  getAllUsers: () => {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('user_')) {
        const username = key.replace('user_', '');
        users.push({
          username,
          userData: getItem(key)
        });
      }
    }
    return users;
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