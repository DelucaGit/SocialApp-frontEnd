import React, { useState } from 'react';
import { createPost } from '../services/dataService';
import { Post } from '../types';

interface CreatePostWidgetProps {
  onPostCreated: (post: Post) => void;
  currentUserAvatar?: string;
}

const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({ onPostCreated, currentUserAvatar }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const newPost = await createPost({ title, content });
      onPostCreated(newPost);
      setTitle('');
      setContent('');
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to create post", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 p-2 mb-4 rounded-md">
      {!isExpanded ? (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
             <img src={currentUserAvatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} alt="Current User" className="w-full h-full" />
          </div>
          <input 
            type="text" 
            placeholder="Create Post" 
            className="bg-gray-100 border border-gray-200 rounded hover:bg-white hover:border-blue-500 flex-1 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-text"
            onClick={() => setIsExpanded(true)}
            readOnly
          />
          <button className="p-2 hover:bg-gray-100 rounded text-gray-500">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-2">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              required
              autoFocus
            />
          </div>
          <div className="mb-2">
            <textarea
              placeholder="Text (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 h-24 focus:outline-none focus:border-blue-500 resize-none"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-1.5 text-gray-500 font-bold hover:bg-gray-100 rounded-full text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-1.5 bg-blue-600 text-white font-bold rounded-full text-sm hover:bg-blue-700 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreatePostWidget;