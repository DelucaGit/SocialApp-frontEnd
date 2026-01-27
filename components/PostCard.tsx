import React, { useState } from 'react';
import { MessageSquare, MoreHorizontal, Pencil, Check, X } from 'lucide-react';
import { Post, User } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { updatePost } from '../services/dataService';

interface PostCardProps {
  post: Post;
  author?: User;
  currentUser?: User;
  onPostUpdated?: (post: Post) => void;
  compact?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, author, currentUser, onPostUpdated, compact = false }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = currentUser?.id === post.authorId;

  const handlePostClick = () => {
      if (isEditing) return;
      navigate(`/post/${post.id}`);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
        const updatedPost = await updatePost(post.id, editContent);
        setIsEditing(false);
        if (onPostUpdated) {
            onPostUpdated(updatedPost);
        }
    } catch (error) {
        console.error("Failed to update post", error);
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditContent(post.content);
    setIsEditing(false);
  };

  return (
    <div 
        onClick={handlePostClick}
        className={`flex flex-col bg-white border border-gray-300 rounded-md hover:border-gray-400 cursor-pointer transition-colors duration-200 mb-4 overflow-hidden ${compact ? 'text-sm' : ''}`}
    >
      {/* Content Column */}
      <div className="flex-1 p-3 pb-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center text-xs text-gray-500 space-x-1">
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
            
            {isOwner && !isEditing && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                    title="Edit post"
                >
                    <Pencil size={14} />
                </button>
            )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-2 leading-snug">{post.title}</h3>

        {/* Text Content */}
        {isEditing ? (
            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    rows={3}
                />
                <div className="flex space-x-2 justify-end mt-2">
                    <button onClick={handleCancel} className="flex items-center px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">
                        <X size={12} className="mr-1"/> Cancel
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded">
                        <Check size={12} className="mr-1"/> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        ) : (
            post.content && (
              <div className="text-sm text-gray-800 mb-3 break-words line-clamp-3">
                 {post.content}
              </div>
            )
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