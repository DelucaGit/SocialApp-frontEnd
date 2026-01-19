import React, { useState } from 'react';
import { Comment, User } from '../types';
import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommentNodeProps {
  comment: Comment;
  usersCache: Record<string, User>;
}

const CommentNode: React.FC<CommentNodeProps> = ({ comment, usersCache }) => {
  const [collapsed, setCollapsed] = useState(false);
  const author = usersCache[comment.authorId];
  
  if (collapsed) {
    return (
      <div className="py-2 pl-2">
        <div className="text-xs text-gray-500 cursor-pointer italic" onClick={() => setCollapsed(false)}>
           [+] {author ? author.username : 'Loading...'} commented (click to expand)
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 relative group">
      {/* Thread line */}
      <div 
        className="absolute top-8 left-2.5 bottom-0 w-0.5 bg-gray-200 group-hover:bg-gray-300 transition-colors cursor-pointer" 
        onClick={() => setCollapsed(true)}
      ></div>

      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
           {author ? (
               <Link to={`/user/${author.id}`}>
                    <img src={author.avatar} className="w-6 h-6 rounded-full inline-block mr-1" alt={author.username} />
                    <span className="font-bold text-gray-800 hover:underline">{author.username}</span>
               </Link>
           ) : (
               <span className="font-bold text-gray-400">Loading...</span>
           )}
           <span>•</span>
           <span>{comment.timestamp}</span>
        </div>

        {/* Content */}
        <div className="ml-7">
            <div className="text-sm text-gray-800 mb-2">
                {comment.content}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 text-gray-500 font-bold text-xs mb-2">
                <button className="flex items-center space-x-1 hover:bg-gray-100 px-1 py-1 rounded">
                    <MessageSquare size={16} />
                    <span>Reply</span>
                </button>
            </div>
            
            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="border-l-0">
                    {comment.replies.map(reply => (
                        <div key={reply.id} className="pl-2">
                            <CommentNode comment={reply} usersCache={usersCache} />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CommentNode;