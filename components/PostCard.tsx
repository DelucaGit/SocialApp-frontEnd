import React from 'react';
import { MessageSquare, MoreHorizontal } from 'lucide-react';
import { Post, User } from '../types';
import { Link, useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  author?: User;
  compact?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, author, compact = false }) => {
  const navigate = useNavigate();

  const handlePostClick = () => {
      navigate(`/post/${post.id}`);
  };

  return (
    <div 
        onClick={handlePostClick}
        className={`flex flex-col bg-white border border-gray-300 rounded-md hover:border-gray-400 cursor-pointer transition-colors duration-200 mb-4 overflow-hidden ${compact ? 'text-sm' : ''}`}
    >
      {/* Content Column */}
      <div className="flex-1 p-3 pb-1">
        {/* Header */}
        <div className="flex items-center text-xs text-gray-500 mb-2 space-x-1">
          <span>Posted by</span>
          <Link 
            to={`/user/${post.authorId}`} 
            className="hover:underline flex items-center space-x-1 font-bold text-gray-700"
            onClick={(e) => e.stopPropagation()} 
          >
            {author ? (
                <>
                    <img src={author.avatar} alt={author.username} className="w-4 h-4 rounded-full" />
                    <span>u/{author.username}</span>
                </>
            ) : (
                <span>u/loading...</span>
            )}
          </Link>
          <span>•</span>
          <span>{post.timestamp}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-2 leading-snug">{post.title}</h3>

        {/* Text Content */}
        {post.content && (
          <div className="text-sm text-gray-800 mb-3 break-words line-clamp-3">
             {post.content}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center space-x-2 text-gray-500 text-xs font-bold">
          <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <MessageSquare size={16} />
            <span>{post.commentCount} Comments</span>
          </div>
          <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
             <MoreHorizontal size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;