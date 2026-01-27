import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Post } from '../types';
import { getUser, getUserPosts, sendFriendRequest, getFriends, deleteFriendship, getFriendshipStatus, acceptFriendRequest, rejectFriendRequest, getFriendRequests } from '../services/dataService';
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
  const [friendshipData, setFriendshipData] = useState<{id: string, status: string, isIncoming: boolean} | null>(null);
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
      if (currentUser && currentUser.id !== userId) {
          try {
              const statusData = await getFriendshipStatus(userId);
              if (statusData) {
                  // Workaround: Check if this user is in my incoming requests list
                  // This fixes the issue where backend might return incorrect isIncomingRequest
                  let isIncoming = statusData.isIncomingRequest;
                  
                  if (statusData.status === 'PENDING') {
                      try {
                          const myRequests = await getFriendRequests();
                          const requestFromThisUser = myRequests.find(req => req.senderId === userId);
                          if (requestFromThisUser) {
                              isIncoming = true;
                          } else if (isIncoming) {
                              // If backend says incoming but it's not in my requests list, 
                              // it might be outgoing (or the list is empty/failed)
                              // But let's trust the list if we found it.
                              // If we didn't find it, we can't be 100% sure it's outgoing without checking sent requests (which we don't have endpoint for)
                              // So we'll stick with backend value unless we prove it's incoming.
                              
                              // Actually, if I am the sender, it should NOT be in my incoming requests.
                              // If backend says isIncoming=true, but it's NOT in my list, it's suspicious.
                              // Let's assume if it's not in my incoming list, it's outgoing.
                              isIncoming = false;
                          }
                      } catch (err) {
                          console.warn("Failed to cross-check with friend requests list", err);
                      }
                  }

                  setFriendshipData({
                      id: String(statusData.friendshipId),
                      status: statusData.status,
                      isIncoming: isIncoming
                  });
              } else {
                  setFriendshipData(null);
              }
          } catch (e) {
              console.warn("Failed to check friendship status", e);
          }
      }
      
      setLoading(false);
    };

    fetchData();
  }, [userId, currentUser]);

  const handleSendRequest = async () => {
      if (!user) return;
      try {
          await sendFriendRequest(user.id);
          // Refresh status to get the new ID
          const status = await getFriendshipStatus(user.id);
          if (status) {
             setFriendshipData({
                 id: String(status.friendshipId),
                 status: status.status,
                 isIncoming: false // We just sent it, so it's definitely outgoing
             });
          }
      } catch (error) {
          console.error("Failed to send friend request", error);
      }
  };

  const handleAcceptRequest = async () => {
      if (!friendshipData) return;
      try {
          await acceptFriendRequest(friendshipData.id);
          setFriendshipData(prev => prev ? { ...prev, status: 'ACCEPTED' } : null);
      } catch (error) {
          console.error("Failed to accept request", error);
      }
  };

  const handleRejectRequest = async () => {
      if (!friendshipData) return;
      try {
          await rejectFriendRequest(friendshipData.id);
          setFriendshipData(null);
      } catch (error) {
          console.error("Failed to reject request", error);
      }
  };

  const handleRemoveOrCancel = async () => {
      if (!friendshipData) return;
      const isPending = friendshipData.status === 'PENDING';
      const message = isPending ? "Cancel friend request?" : `Remove ${user?.displayName} from friends?`;
      
      if (window.confirm(message)) {
          try {
              await deleteFriendship(friendshipData.id);
              setFriendshipData(null);
          } catch (error) {
              console.error("Failed to remove/cancel", error);
          }
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
                    <div className="w-full mt-2">
                        {!friendshipData ? (
                            <button onClick={handleSendRequest} className="w-full py-2 px-4 rounded-full font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center space-x-2 transition">
                                <Plus size={16} />
                                <span>Add Friend</span>
                            </button>
                        ) : friendshipData.status === 'ACCEPTED' ? (
                            <button onClick={handleRemoveOrCancel} className="w-full py-2 px-4 rounded-full font-bold text-sm border border-red-600 text-red-600 hover:bg-red-50 flex items-center justify-center space-x-2 transition">
                                <X size={16} />
                                <span>Remove Friend</span>
                            </button>
                        ) : friendshipData.status === 'PENDING' && friendshipData.isIncoming ? (
                            <div className="flex space-x-2">
                                <button onClick={handleAcceptRequest} className="flex-1 py-2 px-4 rounded-full font-bold text-sm bg-green-600 text-white hover:bg-green-700 flex items-center justify-center space-x-2 transition">
                                    <Check size={16} />
                                    <span>Accept</span>
                                </button>
                                <button onClick={handleRejectRequest} className="flex-1 py-2 px-4 rounded-full font-bold text-sm bg-red-600 text-white hover:bg-red-700 flex items-center justify-center space-x-2 transition">
                                    <X size={16} />
                                    <span>Reject</span>
                                </button>
                            </div>
                        ) : friendshipData.status === 'PENDING' && !friendshipData.isIncoming ? (
                            <button onClick={handleRemoveOrCancel} className="w-full py-2 px-4 rounded-full font-bold text-sm bg-gray-300 text-gray-700 hover:bg-gray-400 flex items-center justify-center space-x-2 transition">
                                <X size={16} />
                                <span>Cancel Request</span>
                            </button>
                        ) : null}
                    </div>
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