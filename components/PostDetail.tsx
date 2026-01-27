import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Post, Comment as CommentType, User } from '../types';
import { getPost, getComments, createComment, getUser } from '../services/dataService';
import PostCard from './PostCard';
import Comment from './Comment';
import { ArrowLeft, Send } from 'lucide-react';

interface PostDetailProps {
  currentUser: User | null;
}

const PostDetail: React.FC<PostDetailProps> = ({ currentUser }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | undefined>(undefined);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;
      try {
        const [postData, commentsData] = await Promise.all([
          getPost(postId),
          getComments(postId)
        ]);
        
        if (postData) {
            setPost(postData);
            // Hämta författaren till inlägget för att visa avatar/namn korrekt i PostCard
            if (postData.authorId) {
                try {
                    const authorData = await getUser(postData.authorId);
                    if (authorData) setAuthor(authorData);
                } catch (e) {
                    console.warn("Failed to load author", e);
                }
            }
        }
        setComments(commentsData);
      } catch (error) {
        console.error("Failed to fetch post details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId || !currentUser) return;

    setSubmitting(true);
    try {
      const created = await createComment(postId, newComment);
      setComments(prev => [created, ...prev]);
      setNewComment("");
      // Uppdatera antalet kommentarer visuellt på inlägget
      if (post) {
          setPost({ ...post, commentCount: (post.commentCount || 0) + 1 });
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Callback som skickas till Comment-komponenten
  const handleCommentUpdated = (updatedComment: CommentType) => {
      setComments(prev => prev.map(c => c.id === updatedComment.id ? updatedComment : c));
  };

  const handlePostUpdated = (updatedPost: Post) => {
      setPost(updatedPost);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!post) return <div className="p-10 text-center">Post not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={20} className="mr-1" /> Back
      </button>

      <PostCard 
        post={post} 
        author={author}
        currentUser={currentUser} 
        onPostUpdated={handlePostUpdated}
      />

      <div className="mt-6">
        <h3 className="text-lg font-bold mb-4">Comments ({comments.length})</h3>
        
        {currentUser ? (
            <form onSubmit={handleCommentSubmit} className="mb-6 flex gap-2">
                <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                    type="submit" 
                    disabled={submitting || !newComment.trim()}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                    <Send size={20} />
                </button>
            </form>
        ) : (
            <div className="mb-6 p-4 bg-gray-100 rounded text-center text-sm">
                Please login to comment.
            </div>
        )}

        <div className="space-y-4">
            {comments.map(comment => (
                <Comment 
                    key={comment.id} 
                    comment={comment} 
                    currentUser={currentUser} 
                    onCommentUpdated={handleCommentUpdated}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;