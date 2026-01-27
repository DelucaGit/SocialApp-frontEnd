import React, { useState } from 'react';
import { MessageSquare, MoreHorizontal, Pencil, Check, X, Send, Loader2 } from 'lucide-react';
import { Post, User, Comment as CommentType } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { updatePost, getComments, createComment } from '../services/dataService';
import Comment from './Comment';

interface PostCardProps {
  post: Post;
  author?: User;
  currentUser?: User;
  onPostUpdated?: (post: Post) => void;
  compact?: boolean;
  interactiveComments?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  author, 
  currentUser, 
  onPostUpdated, 
  compact = false,
  interactiveComments = false 
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  
  // State för inline-kommentarer
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwner = currentUser?.id === post.authorId;
  
  // Använd author-prop om den finns, annars data direkt från inlägget
  const displayAuthorName = author?.username || post.authorName;
  const displayAuthorAvatar = author?.avatar || post.authorAvatar;

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

  const toggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Om vi inte kör "interactive" (t.ex. inne på PostDetail), låt klicket bubbla upp (navigera)
    if (!interactiveComments) return;

    if (!showComments) {
        setLoadingComments(true);
        try {
            const fetchedComments = await getComments(post.id);
            setComments(fetchedComments);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setLoadingComments(false);
        }
    }
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      
      setSubmittingComment(true);
      try {
          const created = await createComment(post.id, newComment);
          setComments(prev => [created, ...prev]);
          setNewComment("");
      } catch (error) {
          console.error("Failed to post comment", error);
      } finally {
          setSubmittingComment(false);
      }
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
                {displayAuthorName ? (
                    <>
                        <img src={displayAuthorAvatar} alt={displayAuthorName} className="w-5 h-5 rounded-full object-cover" />
                        <span>u/{displayAuthorName}</span>
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
          <div 
            className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer"
            onClick={toggleComments}
          >
            <MessageSquare size={16} />
            <span>{showComments ? 'Hide Comments' : 'Show Comments'}</span>
          </div>
          <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
             <MoreHorizontal size={16} />
          </div>
        </div>

        {/* Inline Comments Section */}
        {showComments && (
            <div className="mt-3 pt-3 border-t border-gray-100 cursor-default" onClick={(e) => e.stopPropagation()}>
                {currentUser ? (
                    <form onSubmit={handleCommentSubmit} className="mb-4 flex gap-2">
                        <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 border border-gray-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            type="submit" 
                            disabled={submittingComment || !newComment.trim()}
                            className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                ) : (
                    <div className="mb-4 p-2 bg-gray-50 rounded text-center text-xs">
                        Please login to comment.
                    </div>
                )}
                
                {loadingComments ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-blue-600" size={20} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {comments.length > 0 ? (
                            comments.map(comment => (
                                <Comment key={comment.id} comment={comment} currentUser={currentUser} />
                            ))
                        ) : (
                            <p className="text-center text-gray-500 text-xs py-2">No comments yet.</p>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;