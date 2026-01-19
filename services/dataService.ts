import { MOCK_POSTS, MOCK_USERS, MOCK_COMMENTS } from '../constants';
import { Post, User, Comment } from '../types';

// Configuration for API
// Toggle USE_MOCK_DATA to false to switch to real backend API calls
const API_BASE_URL = 'http://localhost:3001/api'; 
const USE_MOCK_DATA = true; 

// Simulate API delay for mocks
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for making API requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ...' // Add token here if needed
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export const getCurrentUser = async (): Promise<User> => {
  if (USE_MOCK_DATA) {
    await delay(100);
    const user = MOCK_USERS['curr'];
    if (!user) {
      throw new Error('Mock user "curr" not found in constants');
    }
    return user;
  }
  return apiRequest<User>('/auth/me'); // Assumes an endpoint to get current session user
};

export const getPosts = async (page: number, limit: number): Promise<Post[]> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const start = (page - 1) * limit;
    // Loop data if we run out to simulate infinite feed
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
  return apiRequest<User>(`/users/${userId}`);
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