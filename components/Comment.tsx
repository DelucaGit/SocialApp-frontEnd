import React, { useState } from 'react';
import { User, Comment as CommentType } from '../types';
import { updateComment, replyToComment, getReplies } from '../services/dataService';
import { Pencil, Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommentProps {
    comment: CommentType;
    currentUser?: User | null;
    onCommentUpdated?: (comment: CommentType) => void;
}

const Comment: React.FC<CommentProps> = ({ comment, currentUser, onCommentUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isSaving, setIsSaving] = useState(false);
    
    // Reply state
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [replies, setReplies] = useState<CommentType[]>([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [hasFetchedReplies, setHasFetchedReplies] = useState(false);

    const isOwner = currentUser?.id === comment.authorId;

    const handleSave = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);
        try {
            const updated = await updateComment(comment.id, editContent);
            setIsEditing(false);
            if (onCommentUpdated) onCommentUpdated(updated);
        } catch (e) {
            console.error("Failed to update comment", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return;
        setIsSaving(true);
        try {
            // Om vi inte har hämtat tidigare svar än, hämta dem nu så vi inte tappar kontexten
            let currentReplies = replies;
            if (!hasFetchedReplies) {
                try {
                    currentReplies = await getReplies(comment.id);
                    setHasFetchedReplies(true);
                } catch (e) {
                    console.warn("Could not fetch existing replies", e);
                }
            }

            const newReply = await replyToComment(comment.id, replyContent);
            setReplies([...currentReplies, newReply]);
            setReplyContent("");
            setIsReplying(false);
            setShowReplies(true);
        } catch (e) {
            console.error("Failed to reply", e);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleReplies = async () => {
        if (!showReplies && !hasFetchedReplies) {
            setLoadingReplies(true);
            try {
                const fetchedReplies = await getReplies(comment.id);
                setReplies(fetchedReplies);
                setHasFetchedReplies(true);
            } catch (e) {
                console.error("Failed to fetch replies", e);
            } finally {
                setLoadingReplies(false);
            }
        }
        setShowReplies(!showReplies);
    };

    return (
        <div className="mb-2">
            <div className="flex space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Link to={`/user/${comment.authorId}`} className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                     {/* Vi antar att avatar finns, annars fallback */}
                     <img src={`https://www.gravatar.com/avatar/${comment.authorName}?d=identicon`} alt={comment.authorName} className="w-full h-full object-cover"/>
                </div>
            </Link>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                        <Link to={`/user/${comment.authorId}`} className="font-bold text-gray-700 hover:underline">
                            {comment.authorName}
                        </Link>
                        <span>•</span>
                        <span>{comment.timestamp}</span>
                    </div>
                    {isOwner && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-200 transition"
                        >
                            <Pencil size={12} />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="mt-1">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            rows={2}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                            <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="flex items-center px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded">
                                <X size={12} className="mr-1"/> Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded">
                                <Check size={12} className="mr-1"/> Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                        <div className="flex items-center space-x-4 mt-2">
                            {currentUser && (
                                <button 
                                    onClick={() => setIsReplying(!isReplying)}
                                    className="flex items-center text-xs text-gray-500 hover:text-gray-800 font-bold"
                                >
                                    <MessageSquare size={12} className="mr-1"/> Reply
                                </button>
                            )}
                            <button 
                                onClick={toggleReplies}
                                className="text-xs text-gray-500 hover:text-blue-600"
                            >
                                {showReplies 
                                    ? 'Hide Replies' 
                                    : (hasFetchedReplies ? 'Show Replies' : 'Get Replies')
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
            </div>

            {/* Reply Form */}
            {isReplying && (
                <div className="ml-11 mb-3">
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        placeholder="Write a reply..."
                        rows={2}
                        autoFocus
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button 
                            onClick={() => setIsReplying(false)} 
                            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleReply} 
                            disabled={isSaving || !replyContent.trim()} 
                            className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
                        >
                            {isSaving ? 'Replying...' : 'Reply'}
                        </button>
                    </div>
                </div>
            )}

            {/* Nested Replies */}
            {showReplies && (
                <div className="ml-11 space-y-2">
                    {loadingReplies && (
                        <div className="flex items-center text-xs text-gray-500 py-2">
                            <Loader2 size={12} className="animate-spin mr-2"/> Loading replies...
                        </div>
                    )}
                    {replies.map(reply => (
                        <Comment 
                            key={reply.id} 
                            comment={reply} 
                            currentUser={currentUser} 
                        />
                    ))}
                    {!loadingReplies && replies.length === 0 && hasFetchedReplies && (
                        <div className="text-xs text-gray-400 italic py-1">No replies yet.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Comment;