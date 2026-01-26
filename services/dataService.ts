import { MOCK_POSTS, MOCK_USERS, MOCK_COMMENTS } from '../constants';
import { Post, User, Comment } from '../types';

// Configuration for API
const USE_LOCAL_API = true; // Set to true to use your local Java backend
const REMOTE_API_URL = 'https://outstanding-panda-jojorisinorg-51f24c08.koyeb.app';
const LOCAL_API_URL = 'http://localhost:8080'; // Direct URL to backend to avoid proxy issues

const API_BASE_URL = USE_LOCAL_API ? LOCAL_API_URL : REMOTE_API_URL;
const USE_MOCK_DATA = false; 

console.log("Using API Base URL:", API_BASE_URL);

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
    friends: user.friends || [],
    friendshipId: user.friendshipId ? String(user.friendshipId) : undefined
  };
};

// Helper to map API post to App post
const mapPost = (post: any): Post => {
  const rawDate = post.timestamp || post.createdAt || new Date().toISOString();
  const formattedDate = new Date(rawDate).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine comment count with priority: explicit count > list length
  let count = 0;
  if (typeof post.commentCount === 'number') {
      count = post.commentCount;
  } else if (typeof post.commentsCount === 'number') {
      count = post.commentsCount;
  } else if (post.comments && Array.isArray(post.comments)) {
      count = post.comments.length;
  }

  return {
    ...post,
    id: String(post.postId || post.id),
    authorId: post.userId ? String(post.userId) : (post.authorId ? String(post.authorId) : ''),
    authorName: post.username || post.authorName || 'Unknown',
    authorAvatar: post.profileImagePath || post.userAvatar || post.authorAvatar || `https://www.gravatar.com/avatar/${post.username || 'default'}?d=identicon`,
    content: post.text || post.content, // Map 'text' from backend to 'content'
    timestamp: formattedDate,
    commentCount: count
  };
};

const mapComment = (comment: any): Comment => {
  const rawDate = comment.createdAt || comment.timestamp || new Date().toISOString();
  const formattedDate = new Date(rawDate).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: String(comment.commentId || comment.id),
    postId: String(comment.postId),
    authorId: String(comment.userId || comment.authorId),
    authorName: comment.username || comment.authorName || 'Unknown',
    content: comment.text || comment.content,
    timestamp: formattedDate
  };
};

// Helper for making API requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
    // IMPORTANT: This allows the browser to send/receive httpOnly cookies (refreshToken) for ALL requests
    credentials: 'include',
  };

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized (Token Expired)
    // We skip this logic for login/logout/refresh endpoints to avoid infinite loops
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/logout')) {
      try {
        // Attempt to refresh the token
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // Send the refreshToken cookie
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Backend RefreshTokenResponse only returns accessToken
          const newAccessToken = data.accessToken;
          
          if (newAccessToken) {
            localStorage.setItem('token', newAccessToken);
            
            // Update the header with the new token and retry the original request
            if (config.headers) (config.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(`${API_BASE_URL}${endpoint}`, config);
          }
        } else {
          // Refresh failed (token invalid or expired), force logout
          throw new Error('Session expired');
        }
      } catch (refreshError) {
        // If refresh fails, we must log out to clear state
        await logout(); 
        throw new Error('Session expired. Please login again.');
      }
    }
    
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
  // Backend LoginResponseDTO returns { accessToken, userId, role, username }
  const response = await apiRequest<{ accessToken: string, userId: number, role: string, username: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  const token = response.accessToken;
  
  if (token) {
    localStorage.setItem('token', token);

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
  // Register returns LoginResponseDTO (same as login)
  const response = await apiRequest<{ accessToken: string, userId: number, role: string, username: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  
  if (response.accessToken) {
    localStorage.setItem('token', response.accessToken);
    
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
    // This call now includes credentials, so backend can delete the cookie
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error("Logout API call failed", e);
  } finally {
    localStorage.removeItem('token');
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

export const updateProfile = async (bio: string, profileImagePath: string): Promise<User> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      const user = JSON.parse(storedUserStr);
      user.bio = bio;
      user.profileImagePath = profileImagePath;
      user.avatar = profileImagePath || `https://www.gravatar.com/avatar/${user.username}?d=identicon`;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    throw new Error("No user logged in");
  }

  const response = await apiRequest<any>('/my', {
    method: 'PATCH',
    body: JSON.stringify({ bio, profileImagePath }),
  });

  const user = mapUser(response);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
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
  let rawPosts: any[] = [];
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
    const response = await apiRequest<any>(`/posts/${postId}/comments`);
    
    // Handle case where response is not an array (e.g. wrapped in an object or null)
    if (!Array.isArray(response)) {
        console.warn(`getComments expected array but got:`, response);
        // If it's a Spring Page object, try to extract content
        if (response && response.content && Array.isArray(response.content)) {
            return response.content.map(mapComment);
        }
        return [];
    }
    
    return response.map(mapComment);
};

export const createComment = async (postId: string, content: string): Promise<Comment> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      authorId: 'curr',
      authorName: 'You',
      content,
      timestamp: new Date().toISOString()
    };
    MOCK_COMMENTS.push(newComment);
    return newComment;
  }

  const response = await apiRequest<any>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text: content }),
  });

  return mapComment(response);
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
  
  // Use the endpoint provided by the user: /posts/user/{userId}
  try {
    const response = await apiRequest<any>(`/users/${userId}/posts`);
    
    let rawPosts: any[] = [];
    if (response.content && Array.isArray(response.content)) {
      rawPosts = response.content;
    } else if (Array.isArray(response)) {
      rawPosts = response;
    }
    
    const posts = rawPosts.map(mapPost);

    // Fetch comments for each post to get the correct count
    const postsWithCounts = await Promise.all(posts.map(async (post) => {
      try {
        const comments = await getComments(post.id);
        return {
          ...post,
          commentCount: comments.length
        };
      } catch (err) {
        console.warn(`Failed to fetch comments for post ${post.id}`, err);
        return post;
      }
    }));

    return postsWithCounts;
  } catch (e) {
    console.error(`Failed to fetch posts for user ${userId}`, e);
    return [];
  }
};

export const getFriends = async (userId: string): Promise<User[]> => {
  if (USE_MOCK_DATA) {
    await delay(200);
    return [];
  }
  try {
    // Assuming endpoint /users/{userId}/friends exists
    const response = await apiRequest<any[]>(`/users/${userId}/friends`);
    if (!Array.isArray(response)) return [];
    return response.map(mapUser);
  } catch (e) {
    console.warn(`Failed to fetch friends for user ${userId}`, e);
    return [];
  }
};

export const getMyFriends = async (): Promise<User[]> => {
  if (USE_MOCK_DATA) {
    await delay(200);
    return [];
  }
  try {
    const response = await apiRequest<any[]>('/my/friends');
    if (!Array.isArray(response)) return [];
    return response.map(mapUser);
  } catch (e) {
    console.warn("Failed to fetch my friends", e);
    return [];
  }
};

export const getFriendshipStatus = async (userId: string): Promise<{friendshipId: number, status: string, isIncomingRequest: boolean} | null> => {
  if (USE_MOCK_DATA) {
    await delay(200);
    return null;
  }
  try {
    const response = await apiRequest<any>(`/friendships/status/${userId}`);
    if (!response || (!response.friendshipId && !response.status)) return null;
    return response;
  } catch (e) {
    return null;
  }
};

export const sendFriendRequest = async (receiverId: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        await delay(200);
        return;
    }
    // The backend controller extracts senderId from the JWT token.
    // We only need to pass the receiverId in the URL path.
    await apiRequest(`/friendships/${receiverId}`, {
        method: 'POST'
    });
};

export const acceptFriendRequest = async (friendshipId: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        await delay(200);
        return;
    }
    // Matches Backend: PUT /friendships/{friendshipId}/accept
    await apiRequest(`/friendships/${friendshipId}/accept`, {
        method: 'PUT'
    });
};

export const rejectFriendRequest = async (friendshipId: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        await delay(200);
        return;
    }
    // Matches Backend: PUT /friendships/{friendshipId}/reject
    await apiRequest(`/friendships/${friendshipId}/reject`, {
        method: 'PUT'
    });
};

export const deleteFriendship = async (friendshipId: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        await delay(200);
        return;
    }
    // Matches Backend: DELETE /friendships/{friendshipId}
    await apiRequest(`/friendships/${friendshipId}`, {
        method: 'DELETE'
    });
};

export interface FriendRequest {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    status: string;
}

export const getFriendRequests = async (): Promise<FriendRequest[]> => {
    if (USE_MOCK_DATA) {
        await delay(200);
        return [];
    }
    try {
        const response = await apiRequest<any[]>('/my/friend-request');
        console.log("Friend Requests Response:", response); // Debugging
        if (!Array.isArray(response)) return [];
        
        // Fetch user details for each request to get username and avatar
        const requests = await Promise.all(response.map(async (req) => {
            const senderId = String(req.senderId || req.userId);
            let senderName = req.friendUsername || req.senderName || req.username || req.senderUsername || (req.sender && req.sender.username) || 'Unknown';
            let senderAvatar = req.senderAvatar || req.profileImagePath || (req.sender && req.sender.profileImagePath) || `https://www.gravatar.com/avatar/${senderName}?d=identicon`;

            // If name is Unknown or we just want to be sure, fetch the user details
            if (senderId) {
                try {
                    const user = await getUser(senderId);
                    if (user) {
                        senderName = user.username;
                        senderAvatar = user.avatar;
                    }
                } catch (e) {
                    console.warn(`Could not fetch details for sender ${senderId}`, e);
                }
            }

            return {
                id: String(req.friendshipId || req.id),
                senderId: senderId,
                senderName: senderName,
                senderAvatar: senderAvatar,
                status: req.status || 'PENDING'
            };
        }));
        
        return requests;
    } catch (e) {
        console.warn("Failed to fetch friend requests", e);
        return [];
    }
};