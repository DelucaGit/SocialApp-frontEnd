import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Post } from '../types';
import { getUser, getUserPosts, toggleFriend } from '../services/dataService';
import PostCard from './PostCard';
import { Settings, Plus, Check } from 'lucide-react';
import { MOCK_USERS } from '../constants'; // For current user reference

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');
  
  // Hardcoded current user for demo purposes
  // We use '!' to assert that 'curr' exists in our constants, preventing TS errors
  const currentUser = MOCK_USERS['curr']!;

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      const userData = await getUser(userId);
      const userPosts = await getUserPosts(userId);
      
      setUser(userData);
      setPosts(userPosts);
      
      // Fetch friend details
      if (userData && userData.friends.length > 0) {
          const friendPromises = userData.friends.map(fid => getUser(fid));
          const friendsData = await Promise.all(friendPromises);
          setFriends(friendsData.filter((f): f is User => f !== null));
      } else {
          setFriends([]);
      }
      
      // Check if friend (mock logic)
      if (userData && currentUser.friends.includes(userData.id)) {
        setIsFriend(true);
      } else {
          setIsFriend(false);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [userId, currentUser.friends]);

  const handleFriendToggle = async () => {
      if (!user) return;
      const success = await toggleFriend(currentUser.id, user.id);
      if (success) {
          setIsFriend(!isFriend);
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
                    <img src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full border-4 border-white shadow-sm" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 text-center md:text-left">{user.displayName}</h1>
                <p className="text-gray-500 text-sm mb-4 text-center md:text-left">u/{user.username}</p>
                
                <p className="text-sm text-gray-800 mb-4 leading-relaxed text-center md:text-left">
                    {user.bio}
                </p>

                {currentUser.id !== user.id && (
                    <button 
                        onClick={handleFriendToggle}
                        className={`w-full py-2 px-4 rounded-full font-bold text-sm flex items-center justify-center space-x-2 transition ${isFriend ? 'border border-blue-600 text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {isFriend ? (
                            <>
                                <Check size={16} />
                                <span>Friends</span>
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>Add Friend</span>
                            </>
                        )}
                    </button>
                )}
                
                {currentUser.id === user.id && (
                    <button className="w-full mt-2 py-2 px-4 rounded-full font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent">
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
    </div>
  );
};

export default UserProfile;