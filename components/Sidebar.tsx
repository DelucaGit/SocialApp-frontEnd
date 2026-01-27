import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, User, Check, X } from 'lucide-react';
import { User as UserType } from '../types';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest, FriendRequest } from '../services/dataService';

interface SidebarProps {
  isOpen: boolean;
  currentUser: UserType | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentUser }) => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (currentUser) {
        try {
          const data = await getFriendRequests(); // Hämtar inkommande som default
          setRequests(data);
        } catch (error) {
          console.error("Failed to fetch friend requests", error);
        }
      }
    };
    fetchRequests();
  }, [currentUser]);

  const handleAccept = async (id: string) => {
    try {
      await acceptFriendRequest(id);
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      console.error("Failed to accept", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectFriendRequest(id);
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      console.error("Failed to reject", error);
    }
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      lg:translate-x-0 lg:static lg:inset-auto lg:border-r-0 lg:bg-transparent lg:block
    `}>
      <div className="h-full overflow-y-auto p-4">
        <nav className="space-y-1 mb-6">
          <Link to="/" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100 group">
            <Home className="mr-3 h-6 w-6 text-gray-500 group-hover:text-gray-900" />
            Home
          </Link>
          {currentUser && (
            <Link to={`/user/${currentUser.id}`} className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100 group">
              <User className="mr-3 h-6 w-6 text-gray-500 group-hover:text-gray-900" />
              My Profile
            </Link>
          )}
        </nav>

        {requests.length > 0 && (
          <div className="mt-6">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Friend Requests
            </h3>
            <ul className="mt-2 space-y-2">
              {requests.map((req) => (
                <li key={req.id} className="bg-gray-50 p-2 rounded-md border border-gray-100">
                  <div className="flex items-center mb-2">
                    <Link to={`/user/${req.friendId}`} className="flex-shrink-0">
                      <img className="h-8 w-8 rounded-full object-cover" src={req.friendAvatar} alt={req.friendName} />
                    </Link>
                    <div className="ml-2 min-w-0 flex-1">
                      <Link to={`/user/${req.friendId}`} className="text-sm font-medium text-gray-900 hover:underline truncate block">
                        {req.friendName}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">Wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleAccept(req.id)} className="flex-1 flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700">
                      <Check size={12} className="mr-1" /> Accept
                    </button>
                    <button onClick={() => handleReject(req.id)} className="flex-1 flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700">
                      <X size={12} className="mr-1" /> Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;