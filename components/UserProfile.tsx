import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Post } from '../types';
import { getUser, getUserPosts, sendFriendRequest, getFriends, deleteFriendship, getMyFriends } from '../services/dataService';
import PostCard from './PostCard';
import { Settings, Plus, Check, X } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

interface UserProfileProps {
  currentUser: User | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser }) => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      const userData = await getUser(userId);
      const userPosts = await getUserPosts(userId);
      const userFriends = await getFriends(userId);
      
      setUser(userData);
      setPosts(userPosts);
      setFriends(userFriends);
      
      // Check if friend and get friendship ID
      if (currentUser) {
          try {
              // Fetch the current user's friends list which should contain the friendshipId
              const myFriends = await getMyFriends();
              const friendRecord = myFriends.find(f => f.id === userId);
              
              if (friendRecord) {
                  setIsFriend(true);
                  setFriendshipId(friendRecord.friendshipId || null);
              } else {
                  setIsFriend(false);
                  setFriendshipId(null);
              }
          } catch (e) {
              console.warn("Failed to check friendship status", e);
          }
      }
      
      setLoading(false);
    };

    fetchData();
  }, [userId, currentUser]);

  const handleFriendToggle = async () => {
      if (!user || !currentUser) return;
      
      if (isFriend) {
          // Logic to remove friend
          if (!friendshipId) {
              alert("Cannot remove friend: Friendship ID not found.");
              return;
          }
          
          if (window.confirm(`Are you sure you want to remove ${user.displayName} from your friends?`)) {
              try {
                  await deleteFriendship(friendshipId);
                  setIsFriend(false);
                  setFriendshipId(null);
                  alert("Friend removed.");
              } catch (error) {
                  console.error("Failed to remove friend", error);
                  alert("Failed to remove friend.");
              }
          }
          return;
      }

      try {
          await sendFriendRequest(user.id);
          setRequestSent(true);
          alert("Friend request sent!");
      } catch (error) {
          console.error("Failed to send friend request", error);
          alert("Failed to send friend request");
      }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Profile...</div>;
  if (!user) return <div className="p-10 text-center text-red-500">User not found</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row relative">
          {/* Profile Sidebar (Left on Desktop) */}
          <div className="md:w-1/3 lg:w-1/4 z-10 md:mr-6 mb-6 md:mb-0">
             <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="relative mb-2 flex justify-center md:justify-start">
                    <img src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full border-4 border-white shadow-sm object-cover" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 text-center md:text-left">{user.displayName}</h1>
                <p className="text-gray-500 text-sm mb-4 text-center md:text-left">u/{user.username}</p>
                
                <p className="text-sm text-gray-800 mb-4 leading-relaxed text-center md:text-left">
                    {user.bio}
                </p>

                {currentUser && currentUser.id !== user.id && (
                    <button 
                        onClick={handleFriendToggle}
                        disabled={requestSent}
                        className={`w-full py-2 px-4 rounded-full font-bold text-sm flex items-center justify-center space-x-2 transition ${
                            isFriend 
                            ? 'border border-red-600 text-red-600 hover:bg-red-50' 
                            : requestSent 
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isFriend ? (
                            <>
                                <X size={16} />
                                <span>Remove Friend</span>
                            </>
                        ) : requestSent ? (
                            <span>Request Sent</span>
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>Add Friend</span>
                            </>
                        )}
                    </button>
                )}
                
                {currentUser && currentUser.id === user.id && (
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full mt-2 py-2 px-4 rounded-full font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                    >
                        Edit Profile
                    </button>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                     <button className="text-xs font-bold text-blue-600 uppercase flex items-center">
                        More Options <Settings size={12} className="ml-1" />
                     </button>
                </div>
             </div>
             
             {/* Friend List Mini View */}
             <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mt-4 hidden md:block">
                 <h3 className="font-bold text-sm mb-3">Friends ({friends.length})</h3>
                 <div className="flex flex-wrap gap-2">
                     {friends.map(friend => (
                         <Link key={friend.id} to={`/user/${friend.id}`} className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden hover:opacity-80 transition" title={friend.displayName}>
                             <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                         </Link>
                     ))}
                     {friends.length === 0 && <span className="text-xs text-gray-400">No friends yet.</span>}
                 </div>
             </div>
          </div>

          {/* Main Content Area (Posts) */}
          <div className="flex-1">
             {/* Tabs */}
             <div className="flex items-center space-x-6 border-b border-gray-200 mb-4 overflow-x-auto">
                 <button 
                    onClick={() => setActiveTab('posts')}
                    className={`pb-2 px-1 text-sm font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                     Posts
                 </button>
                 <button 
                    onClick={() => setActiveTab('friends')}
                    className={`pb-2 px-1 text-sm font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'friends' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                     Friends
                 </button>
             </div>

             {/* Tab Content */}
             <div>
                 {activeTab === 'posts' && (
                     <div className="space-y-4">
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard key={post.id} post={post} author={user} />
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-lg border border-gray-200 text-gray-500">
                                <p className="font-bold">No posts yet</p>
                                <p className="text-sm">u/{user.username} hasn't posted anything.</p>
                            </div>
                        )}
                     </div>
                 )}
                 {activeTab === 'friends' && (
                     <div className="bg-white rounded-lg border border-gray-200 p-4">
                         <h2 className="font-bold mb-4">Friends List</h2>
                         <ul className="space-y-2">
                             {friends.length > 0 ? (
                                 friends.map(friend => (
                                     <li key={friend.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded transition">
                                         <Link to={`/user/${friend.id}`} className="flex items-center space-x-3 w-full">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                                <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{friend.displayName}</span>
                                                <span className="text-xs text-gray-500">u/{friend.username}</span>
                                            </div>
                                         </Link>
                                     </li>
                                 ))
                             ) : (
                                <p className="text-sm text-gray-500">No friends found.</p>
                             )}
                         </ul>
                     </div>
                 )}
             </div>
          </div>
      </div>

      {user && (
        <EditProfileModal
            user={user}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
};

export default UserProfile;