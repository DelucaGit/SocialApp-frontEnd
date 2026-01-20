import { MOCK_POSTS, MOCK_USERS, MOCK_COMMENTS } from '../constants';
import { Post, User, Comment } from '../types';

// Configuration for API
const USE_LOCAL_API = true; // Set to true to use your local Java backend
const REMOTE_API_URL = 'https://outstanding-panda-jojorisinorg-51f24c08.koyeb.app';
const LOCAL_API_URL = ''; // Empty string uses the proxy in vite.config.ts

const API_BASE_URL = USE_LOCAL_API ? LOCAL_API_URL : REMOTE_API_URL;
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

// Helper to map API post to App post
const mapPost = (post: any): Post => {
  return {
    ...post,
    id: String(post.id),
    authorId: post.userId ? String(post.userId) : (post.authorId ? String(post.authorId) : ''),
    content: post.text || post.content, // Map 'text' from backend to 'content'
    timestamp: post.timestamp || post.createdAt || new Date().toISOString()
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
    }
    
    return { token, user: null };
  }
  throw new Error("Login failed: No access token received");
};

export const register = async (userData: any): Promise<{ token: string, user: User | null }> => {
  const response = await apiRequest<{ accessToken: string, refreshToken: string, userId?: number | string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    // Fetch user details using userId if available
    if (response.userId) {
        try {
            const userData = await apiRequest<any>(`/users/${response.userId}`);
            const user = mapUser(userData);
            localStorage.setItem('user', JSON.stringify(user));
            return { token: response.accessToken, user };
        } catch (e) {
            console.error("Failed to fetch user details via userId after register", e);
        }
    }
    
    return { token: response.accessToken, user: null };
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

  // Try to get stored user ID to refresh data
  const storedUserStr = localStorage.getItem('user');
  let userId = null;

  if (storedUserStr) {
    try {
      const storedUser = JSON.parse(storedUserStr);
      userId = storedUser.id;
    } catch (e) {
      console.error("Error parsing stored user", e);
    }
  }

  if (userId) {
    try {
      const userData = await apiRequest<any>(`/users/${userId}`);
      const user = mapUser(userData);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (e) {
      console.warn("Failed to refresh user data from API", e);
    }
  }

  // Fallback: return stored user if API failed or we couldn't refresh
  if (storedUserStr) {
    try {
      return JSON.parse(storedUserStr);
    } catch (e) {
      return null;
    }
  }
  
  return null;
};

export const createPost = async (content: string): Promise<Post> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: 'curr',
      content: content,
      commentCount: 0,
      timestamp: new Date().toISOString(),
    };
    MOCK_POSTS.unshift(newPost);
    return newPost;
  }

  // Backend expects { text: "..." } based on PostRequest record
  const response = await apiRequest<any>('/posts', {
    method: 'POST',
    body: JSON.stringify({ text: content }),
  });

  return mapPost(response);
};

export const getPosts = async (page: number, limit: number): Promise<Post[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const start = (page - 1) * limit;
    const allPosts = [...MOCK_POSTS]; 
    return allPosts.slice(start, start + limit);
  }
  
  // Spring Boot uses 0-indexed pages and 'size' instead of 'limit'
  const apiPage = page > 0 ? page - 1 : 0;
  const response = await apiRequest<any>(`/posts?page=${apiPage}&size=${limit}`);

  // Handle Spring Boot Page<T> response which wraps items in 'content'
  let rawPosts = [];
  if (response.content && Array.isArray(response.content)) {
    rawPosts = response.content;
  } else if (Array.isArray(response)) {
    rawPosts = response;
  }

  return rawPosts.map(mapPost);
};

export const getPost = async (postId: string): Promise<Post | undefined> => {
  if (USE_MOCK_DATA) {
    await delay(200);
    return MOCK_POSTS.find(p => p.id === postId);
  }
  const response = await apiRequest<any>(`/posts/${postId}`);
  return mapPost(response);
};

export const getComments = async (postId: string): Promise<Comment[]> => {
    if (USE_MOCK_DATA) {
        await delay(300);
        return MOCK_COMMENTS.filter(c => c.postId === postId);
    }
    return apiRequest<Comment[]>(`/posts/${postId}/comments`);
};

export const getUser = async (userId: string): Promise<User | null> => {
  if (!userId || userId === 'undefined') return null;

  if (USE_MOCK_DATA) {
    await delay(200);
    return MOCK_USERS[userId] || null;
  }
  try {
    const userData = await apiRequest<any>(`/users/${userId}`);
    return mapUser(userData);
  } catch (e) {
    console.warn(`Failed to fetch user ${userId}`, e);
    return null;
  }
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return [...MOCK_POSTS, ...MOCK_POSTS].filter(p => p.authorId === userId);
  }
  // Assuming this endpoint might also return a Page or List
  const response = await apiRequest<any>(`/users/${userId}/posts`);
  
  let rawPosts = [];
  if (response.content && Array.isArray(response.content)) {
    rawPosts = response.content;
  } else if (Array.isArray(response)) {
    rawPosts = response;
  }
  return rawPosts.map(mapPost);
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