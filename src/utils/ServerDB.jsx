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

  // // Login (validate credentials)
  // login: async (username, password) => {
  //   try {
  //     // In json-server, we need to get the user and check manually
  //     const { data } = await apiRequest(`users?username=${username}`);
  //     const user = data.find(
  //       (user) => user.username === username && user.website === password
  //     );

  //     return user
  //       ? { success: true, user }
  //       : { success: false, message: "Invalid credentials" };
  //   } catch (error) {
  //     return { success: false, message: "Login failed" };
  //   }
  // },

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
};

/**
 * Comment-related API functions
 */
export const CommentAPI = {
  // Get all comments
  getAll: async () => {
    const { data } = await apiRequest("comments");
    return data;
  },

  // Get comments by post ID
  getByPost: async (postId) => {
    const { data } = await apiRequest(`comments?postId=${postId}`);
    return data;
  },

  // Create new comment
  create: async (commentData) => {
    const { data } = await apiRequest("comments", {
      method: "POST",
      body: JSON.stringify(commentData),
    });
    return data;
  },

  // Delete comment
  delete: async (id) => {
    await apiRequest(`comments/${id}`, { method: "DELETE" });
    return true;
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

// First, add TodoAPI to ServerDB.jsx
export const TodoAPI = {
  // Get all todos for a user
  getByUser: async (userId) => {
    const { data } = await apiRequest(`todos?userId=${userId}`);
    return data;
  },

  // Create new todo
  create: async (todoData) => {
    const { data } = await apiRequest("todos", {
      method: "POST",
      body: JSON.stringify(todoData),
    });
    return data;
  },

  // Update todo
  update: async (id, todoData) => {
    const { data } = await apiRequest(`todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(todoData),
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
  AlbumAPI,
  PhotoAPI,
  getPaginatedData,
  getNestedResource,
};
