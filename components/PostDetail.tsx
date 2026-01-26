import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Post, Comment, User } from '../types';
import { getPost, getComments, getUser, createComment, getReplies } from '../services/dataService';
import PostCard from './PostCard';
import CommentNode from './CommentNode';
import { Loader2, ArrowLeft } from 'lucide-react';

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;
      setLoading(true);
      
      const postData = await getPost(postId);
      const rootComments = await getComments(postId);

      // Fetch replies for the root comments
      const repliesArrays = await Promise.all(rootComments.map(async (c) => {
          try {
              return await getReplies(c.id);
          } catch (e) {
              return [];
          }
      }));
      const commentsData = [...rootComments, ...repliesArrays.flat()];

      // Collect user IDs to fetch
      const userIds = new Set<string>();
      if (postData) userIds.add(postData.authorId);
      
      const collectUserIds = (cList: Comment[]) => {
          cList.forEach(c => {
              userIds.add(c.authorId);
              if (c.replies) collectUserIds(c.replies);
          });
      };
      collectUserIds(commentsData);

      // Fetch users
      const newUsersCache: Record<string, User> = {};
      await Promise.all(Array.from(userIds).map(async (uid) => {
          const u = await getUser(uid);
          if (u) newUsersCache[uid] = u;
      }));

      setUsersCache(newUsersCache);
      if (postData) {
        setPost({ ...postData, commentCount: commentsData.length });
      } else {
        setPost(null);
      }
      
      // Build Comment Tree
      const commentMap: Record<string, Comment> = {};
      const treeRoots: Comment[] = [];

      commentsData.forEach(c => {
          commentMap[c.id] = { ...c, replies: [] };
      });

      commentsData.forEach(c => {
          if (c.parentId && commentMap[c.parentId]) {
              commentMap[c.parentId].replies!.push(commentMap[c.id]);
          } else {
              treeRoots.push(commentMap[c.id]);
          }
      });

      setComments(treeRoots);
      setLoading(false);
    };

    fetchData();
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!postId || !commentText.trim()) return;
    
    setSubmitting(true);
    try {
      const newComment = await createComment(postId, commentText);
      
      // Add the new comment to the top of the list
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      
      // Update the post's comment count locally so it looks correct immediately
      if (post) {
        setPost({ ...post, commentCount: (post.commentCount || 0) + 1 });
      }

      // If we don't have this user in cache (e.g. first time commenting), fetch them
      if (!usersCache[newComment.authorId]) {
        const author = await getUser(newComment.authorId);
        if (author) {
          setUsersCache(prev => ({ ...prev, [author.id]: author }));
        }
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (newComment: Comment) => {
      // Add the new reply to the correct parent in the state
      const addReplyToTree = (nodes: Comment[]): Comment[] => {
          return nodes.map(node => {
              if (node.id === newComment.parentId) {
                  return { 
                      ...node, 
                      replies: [...(node.replies || []), newComment] 
                  };
              }
              if (node.replies && node.replies.length > 0) {
                  return { 
                      ...node, 
                      replies: addReplyToTree(node.replies) 
                  };
              }
              return node;
          });
      };

      setComments(prev => addReplyToTree(prev));
      if (post) setPost({ ...post, commentCount: (post.commentCount || 0) + 1 });
  };

  const handleRepliesLoaded = async (commentId: string, newReplies: Comment[]) => {
      // 1. Update Comment Tree
      const updateTree = (nodes: Comment[]): Comment[] => {
          return nodes.map(node => {
              if (node.id === commentId) {
                  return { ...node, replies: [...(node.replies || []), ...newReplies] };
              }
              if (node.replies && node.replies.length > 0) {
                  return { ...node, replies: updateTree(node.replies) };
              }
              return node;
          });
      };
      setComments(prev => updateTree(prev));

      // 2. Fetch missing users for the new replies
      const newUserIds = new Set<string>();
      const collectUserIds = (cList: Comment[]) => {
          cList.forEach(c => {
              if (!usersCache[c.authorId]) newUserIds.add(c.authorId);
              if (c.replies) collectUserIds(c.replies);
          });
      };
      collectUserIds(newReplies);

      if (newUserIds.size > 0) {
          const newUsers: Record<string, User> = {};
          await Promise.all(Array.from(newUserIds).map(async (uid) => {
             const u = await getUser(uid);
             if (u) newUsers[uid] = u;
          }));
          setUsersCache(prev => ({ ...prev, ...newUsers }));
      }
  };

  if (loading) return (
      <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
  );

  if (!post) return (
      <div className="text-center py-10">
          <h2 className="text-xl font-bold text-gray-700">Post not found</h2>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">Go Home</button>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-4 px-0 sm:px-4">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center space-x-1 text-gray-500 hover:text-gray-900 mb-4 px-2"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-bold">Back</span>
      </button>

      {/* Main Post (reusing PostCard but we could customize it for full view) */}
      <PostCard post={post} author={usersCache[post.authorId]} />

      {/* Comment Section Input */}
      <div className="bg-white border border-gray-300 rounded-md p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Comment as <span className="text-blue-600 font-bold">You</span></p>
          <textarea 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={submitting}
            className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 min-h-[100px]"
            placeholder="What are your thoughts?"
          ></textarea>
          <div className="flex justify-end mt-2">
              <button 
                onClick={handleCommentSubmit}
                disabled={submitting || !commentText.trim()}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Posting...' : 'Comment'}
              </button>
          </div>
      </div>

      {/* Comments Feed */}
      <div className="bg-white border border-gray-300 rounded-md p-4 min-h-[200px]">
         <div className="border-b border-gray-100 pb-2 mb-4">
             <span className="font-bold text-sm text-gray-700">Sort by: <span className="text-blue-600 cursor-pointer">Best</span></span>
         </div>

         <div className="space-y-2">
             {comments.length > 0 ? (
                 comments.map(comment => (
                     <CommentNode 
                        key={comment.id} 
                        comment={comment} 
                        usersCache={usersCache} 
                        onReply={handleReply} 
                        onRepliesLoaded={handleRepliesLoaded}
                        allowLoadMore={false} // Root comments have already loaded their immediate children
                     />
                 ))
             ) : (
                 <div className="text-center py-10 text-gray-400 text-sm">
                     No comments yet. Be the first to share what you think!
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default PostDetail;