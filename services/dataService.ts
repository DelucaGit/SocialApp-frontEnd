import { MOCK_POSTS, MOCK_USERS, MOCK_COMMENTS } from '../constants';
import { Post, User, Comment } from '../types';

// Configuration for API
const API_BASE_URL = 'https://outstanding-panda-jojorisinorg-51f24c08.koyeb.app'; 
const USE_MOCK_DATA = false; 

// Simulate API delay for mocks
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to map API user to App user
const mapUser = (user: any): User => {
  return {
    id: String(user.userId || user.id), // Map userId from API to id in App
    username: user.username,
    displayName: user.displayName || user.username, // Fallback to username
    avatar: user.profileImagePath || user.avatar || `https://www.gravatar.com/avatar/${user.username}?d=identicon`,
    profileImagePath: user.profileImagePath,
    bio: user.bio || '',
    friends: user.friends || []
  };
};

// Helper for making API requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...headers,
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    
    // Some endpoints might return empty body (like logout)
    const text = await response.text();
    return text ? JSON.parse(text) : {} as T;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Auth Services
export const login = async (credentials: any): Promise<{ token: string, user: User | null }> => {
  const response = await apiRequest<{ accessToken: string, refreshToken: string, userId: number }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  const token = response.accessToken;
  
  if (token) {
    localStorage.setItem('token', token);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    // Fetch user details using userId from login response
    if (response.userId) {
         try {
            const userData = await apiRequest<any>(`/users/${response.userId}`);
            const user = mapUser(userData);
            localStorage.setItem('user', JSON.stringify(user));
            return { token, user };
         } catch (e) {
             console.error("Failed to fetch user details via userId", e);
         }
    } else {
        // Fallback to /auth/me if userId is missing
        try {
            const userData = await apiRequest<any>('/auth/me');
            const user = mapUser(userData);
            localStorage.setItem('user', JSON.stringify(user));
            return { token, user };
        } catch (e) {
            console.warn("Failed to fetch user details after login via /auth/me", e);
        }
    }
    
    return { token, user: null };
  }
  throw new Error("Login failed: No access token received");
};

export const register = async (userData: any): Promise<{ token: string, user: User | null }> => {
  const response = await apiRequest<{ accessToken: string, refreshToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    // Fetch user details immediately to populate the session
    try {
        const userData = await apiRequest<any>('/auth/me');
        const user = mapUser(userData);
        localStorage.setItem('user', JSON.stringify(user));
        return { token: response.accessToken, user };
    } catch (e) {
        console.error("Failed to fetch user after registration", e);
        return { token: response.accessToken, user: null };
    }
  }
  throw new Error("Registration failed: No access token received");
};

export const logout = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error("Logout API call failed", e);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (USE_MOCK_DATA) {
    await delay(100);
    const user = MOCK_USERS['curr'];
    return user || null;
  }
  
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // Always try to fetch fresh data from API first
    const userData = await apiRequest<any>('/auth/me');
    const user = mapUser(userData);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (e) {
    console.warn("Failed to fetch current user from API, using stored if available", e);
    // Fallback to local storage if API fails
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch (parseError) {
            console.error("Error parsing stored user", parseError);
        }
    }
    return null;
  }
};

export const createPost = async (postData: { title: string, content: string }): Promise<Post> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: 'curr',
      title: postData.title,
      content: postData.content,
      commentCount: 0,
      timestamp: new Date().toISOString(),
    };
    MOCK_POSTS.unshift(newPost);
    return newPost;
  }
  return apiRequest<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

export const getPosts = async (page: number, limit: number): Promise<Post[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const start = (page - 1) * limit;
    const allPosts = [...MOCK_POSTS, ...MOCK_POSTS, ...MOCK_POSTS]; 
    return allPosts.slice(start, start + limit);
  }
  return apiRequest<Post[]>(`/posts?page=${page}&limit=${limit}`);
};

export const getPost = async (postId: string): Promise<Post | undefined> => {
  if (USE_MOCK_DATA) {
    await delay(200);
    return MOCK_POSTS.find(p => p.id === postId);
  }
  return apiRequest<Post>(`/posts/${postId}`);
};

export const getComments = async (postId: string): Promise<Comment[]> => {
    if (USE_MOCK_DATA) {
        await delay(300);
        return MOCK_COMMENTS.filter(c => c.postId === postId);
    }
    return apiRequest<Comment[]>(`/posts/${postId}/comments`);
};

export const getUser = async (userId: string): Promise<User | null> => {
  if (USE_MOCK_DATA) {
    await delay(200);
    return MOCK_USERS[userId] || null;
  }
  const userData = await apiRequest<any>(`/users/${userId}`);
  return mapUser(userData);
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return [...MOCK_POSTS, ...MOCK_POSTS].filter(p => p.authorId === userId);
  }
  return apiRequest<Post[]>(`/users/${userId}/posts`);
};

export const toggleFriend = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    if (USE_MOCK_DATA) {
        await delay(200);
        return true;
    }
    await apiRequest(`/users/${currentUserId}/friends`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
    });
    return true;
};