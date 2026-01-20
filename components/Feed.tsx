import React, { useState, useEffect } from 'react';
import { Post, User } from '../types';
import PostCard from './PostCard';
import CreatePostWidget from './CreatePostWidget';
import { getPosts, getUser } from '../services/dataService';
import { Loader2 } from 'lucide-react';

interface FeedProps {
  currentUser?: User | null;
}

const Feed: React.FC<FeedProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});

  const loadPosts = async () => {
    setLoading(true);
    try {
      const newPosts = await getPosts(page, 5);
      
      // Fetch authors for these posts
      const newAuthors: Record<string, User> = {};
      for (const post of newPosts) {
          if (!usersCache[post.authorId] && !newAuthors[post.authorId]) {
              const user = await getUser(post.authorId);
              if (user) newAuthors[user.id] = user;
          }
      }

      setUsersCache(prev => ({ ...prev, ...newAuthors }));
      
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNewPosts];
      });
      
    } catch (error) {
      console.error("Failed to load posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    if (currentUser) {
      setUsersCache(prev => ({ ...prev, [currentUser.id]: currentUser }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-0 sm:px-4">
      {/* Create Post Widget */}
      <CreatePostWidget 
        onPostCreated={handlePostCreated} 
        currentUserAvatar={currentUser?.avatar}
      />

      {/* Filter Bar */}
      <div className="flex items-center space-x-2 mb-4">
          <button className="px-3 py-1.5 bg-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-300">Best</button>
          <button className="px-3 py-1.5 hover:bg-gray-200 rounded-full text-sm font-bold text-gray-500">Hot</button>
          <button className="px-3 py-1.5 hover:bg-gray-200 rounded-full text-sm font-bold text-gray-500">New</button>
          <button className="px-3 py-1.5 hover:bg-gray-200 rounded-full text-sm font-bold text-gray-500">Top</button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <PostCard 
            key={`${post.id}-${index}`} 
            post={post} 
            author={usersCache[post.authorId]} 
          />
        ))}
      </div>

      {/* Loading Indicator / Load More */}
      <div className="py-6 flex justify-center">
        {loading ? (
             <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="animate-spin" />
                <span className="font-medium">Loading posts...</span>
             </div>
        ) : (
            <button 
                onClick={() => setPage(p => p + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition"
            >
                Load More
            </button>
        )}
      </div>
    </div>
  );
};

export default Feed;