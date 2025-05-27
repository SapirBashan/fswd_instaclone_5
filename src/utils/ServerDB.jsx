/**
 * ServerDB - Utility functions for interacting with json-server
 */

// Base URL for all API calls
const API_BASE_URL = "http://localhost:3000";

/**
 * Generic request function with error handling
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;

    // Default headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Parse JSON response (unless it's a DELETE request)
    const data = options.method === "DELETE" ? {} : await response.json();
    return { data, status: response.status };
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

/**
 * User-related API functions
 */
export const UserAPI = {
  // Get all users
  getAll: async () => {
    const { data } = await apiRequest("users");
    return data;
  },

  // Get user by ID
  getById: async (id) => {
    const { data } = await apiRequest(`users/${id}`);
    return data;
  },

  // Get user by username
  getByUsername: async (username) => {
    const { data } = await apiRequest(`users?username=${username}`);
    return data[0]; // Return first match or undefined
  },

  // Create new user
  create: async (userData) => {
    const { data } = await apiRequest("users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    return data;
  },

  // Update user
  update: async (id, userData) => {
    const { data } = await apiRequest(`users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return data;
  },

  // Delete user
  delete: async (id) => {
    await apiRequest(`users/${id}`, { method: "DELETE" });
    return true;
  },

  // Login (validate credentials)
  login: async (username, password) => {
    try {
      // First, try to find the user by username
      const { data } = await apiRequest(
        `users?username=${encodeURIComponent(username)}`
      );

      if (!data || data.length === 0) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // In json-server, we're using the website field to store the password
      // This is just for demo purposes - in a real app, you'd never store or compare
      // plain text passwords
      const user = data.find(
        (user) => user.username === username && user.website === password
      );

      if (user) {
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name || user.username,
            email: user.email,
            // Don't include the password/website in the returned user object
          },
        };
      } else {
        return {
          success: false,
          message: "Invalid password",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Server error during login",
      };
    }
  },

  // Check if a user exists
  checkExists: async (username) => {
    try {
      const { data } = await apiRequest(
        `users?username=${encodeURIComponent(username)}`
      );
      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking username:", error);
      throw error;
    }
  },
};

/**
 * Post-related API functions
 */
export const PostAPI = {
  // Get all posts
  getAll: async () => {
    const { data } = await apiRequest("posts");
    return data;
  },

  // Get post by ID
  getById: async (id) => {
    const { data } = await apiRequest(`posts/${id}`);
    return data;
  },

  // Get posts by user ID
  getByUser: async (userId) => {
    const { data } = await apiRequest(`posts?userId=${userId}`);
    return data;
  },

  // Get posts with pagination, optionally excluding a user's posts and randomizing
  getPosts: async (options = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        excludeUserId = null,
        random = false,
      } = options;

      // Start with base query parameters
      let queryParams = "";

      // Add user exclusion if needed
      if (excludeUserId) {
        queryParams += `userId_ne=${excludeUserId}&`;
      }

      if (!random) {
        // Normal pagination
        queryParams += `_page=${page}&_limit=${limit}`;
        const { data } = await apiRequest(`posts?${queryParams}`);
        return data;
      } else {
        // For random posts with pagination:
        // Fetch a larger set, shuffle, then return the requested page
        queryParams += `_limit=100`; // Fetch more for better randomization
        const { data } = await apiRequest(`posts?${queryParams}`);

        // Shuffle the posts (Fisher-Yates algorithm)
        for (let i = data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [data[i], data[j]] = [data[j], data[i]];
        }

        // Calculate the start and end index for the requested page
        const start = (page - 1) * limit;
        const end = Math.min(start + limit, data.length);

        // Return the slice corresponding to the requested page
        return data.slice(start, end);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  },

  // Create new post
  create: async (postData) => {
    const { data } = await apiRequest("posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
    return data;
  },

  // Update post
  update: async (id, postData) => {
    const { data } = await apiRequest(`posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
    return data;
  },

  // Delete post
  delete: async (id) => {
    await apiRequest(`posts/${id}`, { method: "DELETE" });
    return true;
  },
  
  search: async (query, options = {}) => {
    try {
      const { page = 1, limit = 10 } = options;
      const queryParams = `q=${encodeURIComponent(query)}&_page=${page}&_limit=${limit}`;
      const { data } = await apiRequest(`posts?${queryParams}`);
      return data;
    } catch (error) {
      console.error("Error searching posts:", error);
      throw error;
    }
  },

};

/**
 * Comment-related API functions
 */
export const CommentAPI = {
  // Get all comments
  getAll: async () => {
    const response = await apiRequest("comments");
    return response.data;
  },

  // Get comments by post ID with proper filtering
  getByPost: async (postId) => {
    // Ensure postId is a number for proper comparison
    const targetPostId = typeof postId === 'string' ? parseInt(postId) : postId;
    
    console.log("CommentAPI.getByPost - searching for postId:", targetPostId);
    
    const response = await apiRequest(`comments?postId=${targetPostId}`);
    
    // Additional client-side filtering to ensure we get the right comments
    const filteredComments = response.data.filter(comment => {
      const commentPostId = typeof comment.postId === 'string' ? parseInt(comment.postId) : comment.postId;
      return commentPostId === targetPostId;
    });
    
    console.log("CommentAPI.getByPost - found comments:", filteredComments);
    
    return filteredComments;
  },

  // Get comment by ID
  getById: async (id) => {
    const response = await apiRequest(`comments/${id}`);
    return response.data;
  },

  // Create new comment
  create: async (commentData) => {
    // Ensure the comment has all required fields with proper types
    const completeCommentData = {
      ...commentData,
      postId: typeof commentData.postId === 'string' ? parseInt(commentData.postId) : commentData.postId,
      createdAt: commentData.createdAt || new Date().toISOString()
    };

    console.log("CommentAPI.create - sending data:", completeCommentData);

    const response = await apiRequest("comments", {
      method: "POST",
      body: JSON.stringify(completeCommentData),
    });
    
    console.log("CommentAPI.create - response:", response.data);
    
    return response.data;
  },

  // Update comment
  update: async (id, commentData) => {
    const response = await apiRequest(`comments/${id}`, {
      method: "PUT",
      body: JSON.stringify(commentData),
    });
    return response.data;
  },

  // Delete comment
  delete: async (id) => {
    const response = await apiRequest(`comments/${id}`, {
      method: "DELETE",
    });
    return response;
  },
};

/**
 * Album-related API functions
 */
export const AlbumAPI = {
  // Get all albums
  getAll: async () => {
    const { data } = await apiRequest("albums");
    return data;
  },

  // Get album by ID
  getById: async (id) => {
    const { data } = await apiRequest(`albums/${id}`);
    return data;
  },

  // Get albums by user ID
  getByUser: async (userId) => {
    const { data } = await apiRequest(`albums?userId=${userId}`);
    return data;
  },

  // Create new album
  create: async (albumData) => {
    const { data } = await apiRequest("albums", {
      method: "POST",
      body: JSON.stringify(albumData),
    });
    return data;
  },
};

/**
 * Photo-related API functions
 */
export const PhotoAPI = {
  // Get all photos
  getAll: async () => {
    const { data } = await apiRequest("photos");
    return data;
  },

  // Get photos by album ID with pagination
  getByAlbum: async (albumId, options = {}) => {
    const { page = 1, limit = 10 } = options;

    let queryString = `photos?albumId=${albumId}`;

    // Add pagination if page and limit are provided
    if (page && limit) {
      queryString += `&_page=${page}&_limit=${limit}`;
    }

    const { data } = await apiRequest(queryString);
    return data;
  },

  // Create new photo
  create: async (photoData) => {
    const { data } = await apiRequest("photos", {
      method: "POST",
      body: JSON.stringify(photoData),
    });
    return data;
  },

  delete: async (photoId) => {
    await apiRequest(`photos/${photoId}`, { method: "DELETE" });
    return true;
  },

  // Add update method
  update: async (photoId, photoData) => {
    const { data } = await apiRequest(`photos/${photoId}`, {
      method: "PUT",
      body: JSON.stringify(photoData),
    });
    return data;
  },
};

export const TodoAPI = {
  // Get all todos for a user
  getByUser: async (userId) => {
    const { data } = await apiRequest(`todos?userId=${userId}`);
    return data;
  },

  // Get highest ID to generate next ID
  getNextId: async () => {
    const { data } = await apiRequest('todos');
    const maxId = data.reduce((max, todo) => Math.max(max, todo.id || 0), 0);
    return maxId + 1;
  },

  // Create new todo
  create: async (todoData) => {
    const nextId = await TodoAPI.getNextId();
    const todoWithId = {
      ...todoData,
      id: nextId
    };

    const { data } = await apiRequest("todos", {
      method: "POST",
      body: JSON.stringify(todoWithId),
    });
    return data;
  },

  // Update todo
  update: async (id, todoData) => {
    const { data } = await apiRequest(`todos/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...todoData,
        id: Number(id) // Ensure ID remains a number
      }),
    });
    return data;
  },

  // Delete todo
  delete: async (id) => {
    await apiRequest(`todos/${id}`, { method: "DELETE" });
    return true;
  },
};

/**
 * Likes-related API functions
 */
export const LikesAPI = {
  // Get all likes
  getAll: async () => {
    const response = await apiRequest("likes");
    return response.data;
  },

  // Get likes by target (post or comment) and targetId
  getByTarget: async (targetType, targetId) => {
    const response = await apiRequest(`likes?targetType=${targetType}&targetId=${targetId}`);
    return response.data;
  },

  // Get likes by user
  getByUser: async (userId) => {
    const response = await apiRequest(`likes?userId=${userId}`);
    return response.data;
  },

  // Get specific like by user and target
  getUserLike: async (userId, targetType, targetId) => {
    const response = await apiRequest(`likes?userId=${userId}&targetType=${targetType}&targetId=${targetId}`);
    return response.data[0] || null;
  },

  // Create new like
  create: async (likeData) => {
    const response = await apiRequest("likes", {
      method: "POST",
      body: JSON.stringify(likeData),
    });
    return response.data;
  },

  // Update like (change emoji)
  update: async (id, likeData) => {
    const response = await apiRequest(`likes/${id}`, {
      method: "PUT",
      body: JSON.stringify(likeData),
    });
    return response.data;
  },

  // Delete like
  delete: async (id) => {
    const response = await apiRequest(`likes/${id}`, {
      method: "DELETE",
    });
    return response;
  },

  // Toggle like (create if doesn't exist, delete if exists, update if different emoji)
  toggle: async (userId, targetType, targetId, emoji) => {
    try {
      const existingLike = await LikesAPI.getUserLike(userId, targetType, targetId);
      
      if (existingLike) {
        if (existingLike.emoji === emoji) {
          // Same emoji, remove like
          await LikesAPI.delete(existingLike.id);
          return { action: 'removed', like: null };
        } else {
          // Different emoji, update like
          const updatedLike = await LikesAPI.update(existingLike.id, {
            ...existingLike,
            emoji,
            updatedAt: new Date().toISOString()
          });
          return { action: 'updated', like: updatedLike };
        }
      } else {
        // No existing like, create new one
        const newLike = await LikesAPI.create({
          userId,
          targetType, // 'post' or 'comment'
          targetId,
          emoji,
          createdAt: new Date().toISOString()
        });
        return { action: 'created', like: newLike };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }
};

/**
 * Helper function for adding pagination
 * @param endpoint - The API endpoint
 * @param page - Page number (starts at 1)
 * @param limit - Items per page
 * @returns Paginated data
 */
export const getPaginatedData = async (endpoint, page = 1, limit = 10) => {
  const start = (page - 1) * limit;
  const { data } = await apiRequest(
    `${endpoint}?_start=${start}&_limit=${limit}`
  );
  return data;
};

/**
 * Helper function to get nested resources
 * @param resource - Parent resource name
 * @param id - Parent resource ID
 * @param nestedResource - Child resource name
 */
export const getNestedResource = async (resource, id, nestedResource) => {
  const { data } = await apiRequest(`${resource}/${id}/${nestedResource}`);
  return data;
};


export default {
  UserAPI,
  PostAPI,
  CommentAPI,
  LikesAPI,
  AlbumAPI,
  PhotoAPI,
  TodoAPI,
  getPaginatedData,
  getNestedResource,
};