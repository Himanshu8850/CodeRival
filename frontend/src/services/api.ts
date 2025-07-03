import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  profile_picture?: string;
  beijjati_count: number;
  friends: string[];
  friend_requests_sent: string[];
  friend_requests_received: string[];
  created_at: string;
}

export interface Post {
  _id: string;
  author_id: string;
  author: User;
  content: string;
  is_beizzati: boolean;
  mentioned_users: string[];
  mentioned_users_details: User[];
  visible_to: string[];
  likes: string[];
  comments: any[];
  created_at: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user_id: string;
  username?: string;
}

// Auth API
export const authAPI = {
  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Users API
export const usersAPI = {
  searchUsers: async (query: string): Promise<{ users: User[] }> => {
    const response = await api.get(
      `/users/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  getUserProfile: async (username: string): Promise<{ user: User }> => {
    const response = await api.get(`/users/profile/${username}`);
    return response.data;
  },

  updateProfile: async (profileData: {
    bio?: string;
    profile_picture?: string;
  }): Promise<{ message: string }> => {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  },

  sendFriendRequest: async (username: string): Promise<{ message: string }> => {
    const response = await api.post("/users/friend-request", { username });
    return response.data;
  },

  acceptFriendRequest: async (
    friend_id: string
  ): Promise<{ message: string }> => {
    const response = await api.post("/users/friend-request/accept", {
      friend_id,
    });
    return response.data;
  },

  rejectFriendRequest: async (
    friend_id: string
  ): Promise<{ message: string }> => {
    const response = await api.post("/users/friend-request/reject", {
      friend_id,
    });
    return response.data;
  },

  getFriends: async (): Promise<{ friends: User[] }> => {
    const response = await api.get("/users/friends");
    return response.data;
  },

  getFriendRequests: async (): Promise<{ friend_requests: User[] }> => {
    const response = await api.get("/users/friend-requests");
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  createPostWithImage: async (
    formData: FormData
  ): Promise<{ message: string; post_id: string }> => {
    const response = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        // ❌ Do NOT set content-type for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Post creation failed: " + errorText);
    }

    return await response.json();
  },
  createPost: async (
    content: string,
    is_beizzati: boolean,
    mentioned_users: string[]
  ): Promise<{ message: string; post_id: string }> => {
    const response = await api.post("/posts/", {
      content,
      is_beizzati,
      mentioned_users,
    });
    return response.data;
  },

  getFeed: async (): Promise<{ posts: Post[] }> => {
    const response = await api.get("/posts/feed");
    return response.data;
  },

  getUserPosts: async (username: string): Promise<{ posts: Post[] }> => {
    const response = await api.get(`/posts/user/${username}`);
    return response.data;
  },

  getUserMentions: async (username: string): Promise<{ posts: Post[] }> => {
    const response = await api.get(`/posts/mentions/${username}`);
    return response.data;
  },

  likePost: async (postId: string): Promise<{ message: string }> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  unlikePost: async (postId: string): Promise<{ message: string }> => {
    const response = await api.post(`/posts/${postId}/unlike`);
    return response.data;
  },
};

export default api;
