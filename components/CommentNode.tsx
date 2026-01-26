import React, { useState } from 'react';
import { Comment, User } from '../types';
import { Reply, ChevronDown, Loader2 } from 'lucide-react';
import { replyToComment, getReplies } from '../services/dataService';
import { Link } from 'react-router-dom';

interface CommentNodeProps {
    comment: Comment;
    usersCache: Record<string, User>;
    onReply: (newComment: Comment) => void;
    onRepliesLoaded: (commentId: string, replies: Comment[]) => void;
    allowLoadMore?: boolean;
}

const CommentNode: React.FC<CommentNodeProps> = ({ comment, usersCache, onReply, onRepliesLoaded, allowLoadMore = false }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [repliesLoaded, setRepliesLoaded] = useState(false);

    const author = usersCache[comment.authorId];

    const handleReplySubmit = async () => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const newComment = await replyToComment(comment.id, replyText);
            onReply(newComment);
            setIsReplying(false);
            setReplyText('');
        } catch (error) {
            console.error("Failed to reply", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLoadReplies = async () => {
        setLoadingReplies(true);
        try {
            const replies = await getReplies(comment.id);
            onRepliesLoaded(comment.id, replies);
            setRepliesLoaded(true);
        } catch (error) {
            console.error("Failed to load replies", error);
        } finally {
            setLoadingReplies(false);
        }
    };

    return (
        <div className="flex space-x-3 mb-4">
            <div className="flex-shrink-0">
                <Link to={`/user/${comment.authorId}`}>
                    {author ? (
                        <img src={author.avatar} alt={author.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    )}
                </Link>
            </div>
            <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3 relative group">
                    <div className="flex items-center justify-between mb-1">
                        <Link to={`/user/${comment.authorId}`} className="font-bold text-sm text-gray-900 hover:underline">
                            {author ? author.displayName : comment.authorName}
                        </Link>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                    
                    <div className="mt-2 flex items-center space-x-4">
                        <button 
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-xs font-bold text-gray-500 hover:text-blue-600 flex items-center space-x-1"
                        >
                            <Reply size={14} />
                            <span>Reply</span>
                        </button>
                    </div>
                </div>

                {isReplying && (
                    <div className="mt-3 ml-2">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder={`Reply to ${author ? author.username : 'user'}...`}
                            rows={2}
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                            <button 
                                onClick={() => setIsReplying(false)}
                                className="px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReplySubmit}
                                disabled={submitting || !replyText.trim()}
                                className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                            >
                                {submitting ? 'Replying...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Load More Button */}
                {allowLoadMore && (!comment.replies || comment.replies.length === 0) && !repliesLoaded && (
                    <button 
                        onClick={handleLoadReplies}
                        disabled={loadingReplies}
                        className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                        {loadingReplies ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                        <span>{loadingReplies ? 'Loading...' : 'Load Replies'}</span>
                    </button>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                        {comment.replies.map(reply => (
                            <CommentNode 
                                key={reply.id} 
                                comment={reply} 
                                usersCache={usersCache} 
                                onReply={onReply} 
                                onRepliesLoaded={onRepliesLoaded}
                                allowLoadMore={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentNode;