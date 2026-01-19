import React, { useState, useEffect } from 'react';
import { Post, User } from '../types';
import PostCard from './PostCard';
import { getPosts, getUser } from '../services/dataService';
import { Loader2 } from 'lucide-react';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});

  const loadPosts = async () => {
    setLoading(true);
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
    setPosts(prev => [...prev, ...newPosts]);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="max-w-3xl mx-auto py-6 px-0 sm:px-4">
      {/* Create Post Input Placeholder */}
      <div className="bg-white border border-gray-300 p-2 mb-4 rounded-md flex items-center space-x-2">
         <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
             <img src="https://picsum.photos/seed/curr/150/150" alt="Current User" className="w-full h-full" />
         </div>
         <input 
            type="text" 
            placeholder="Create Post" 
            className="bg-gray-100 border border-gray-200 rounded hover:bg-white hover:border-blue-500 flex-1 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
         />
         <button className="p-2 hover:bg-gray-100 rounded text-gray-500">
             {/* Image Icon placeholder */}
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
         </button>
      </div>

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