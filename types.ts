export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  profileImagePath?: string; // Added field from API
  bio: string;
  friends: string[]; // List of friend IDs
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  commentCount: number;
  timestamp: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  timestamp: string;
  replies?: Comment[]; // Recursive structure for nested comments
}