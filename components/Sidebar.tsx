import React, { useState, useEffect } from 'react';
import { Home, TrendingUp, HelpCircle, UserPlus, Check, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest, FriendRequest } from '../services/dataService';

interface SidebarProps {
    isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
      const fetchRequests = async () => {
          const requests = await getFriendRequests();
          setFriendRequests(requests);
      };
      fetchRequests();
      // Poll for new requests every 30 seconds
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id: string) => {
      try {
          await acceptFriendRequest(id);
          setFriendRequests(prev => prev.filter(req => req.id !== id));
      } catch (e) {
          console.error("Failed to accept request", e);
      }
  };

  const handleReject = async (id: string) => {
      try {
          await rejectFriendRequest(id);
          setFriendRequests(prev => prev.filter(req => req.id !== id));
      } catch (e) {
          console.error("Failed to reject request", e);
      }
  };

  return (
    <div className={`fixed inset-y-0 left-0 pt-14 z-40 w-64 bg-white border-r border-gray-200 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static lg:h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar`}>
      <div className="p-4 space-y-6">
        
        {/* Feeds */}
        <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Feeds</h3>
            <ul className="space-y-1">
                <li>
                    <Link to="/" className={`flex items-center space-x-3 px-2 py-2 rounded-md ${isActive('/') ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Home size={20} />
                        <span className="text-sm font-medium">Home</span>
                    </Link>
                </li>
                <li>
                    <Link to="/popular" className="flex items-center space-x-3 px-2 py-2 rounded-md text-gray-600 hover:bg-gray-50">
                        <TrendingUp size={20} />
                        <span className="text-sm font-medium">Popular</span>
                    </Link>
                </li>
            </ul>
        </div>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center justify-between">
                    <span>Friend Requests</span>
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{friendRequests.length}</span>
                </h3>
                <ul className="space-y-2">
                    {friendRequests.map(req => (
                        <li key={req.id} className="px-2 py-2 bg-gray-50 rounded-md border border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                                <img src={req.senderAvatar} alt={req.senderName} className="w-8 h-8 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{req.senderName}</p>
                                    <p className="text-xs text-gray-500">wants to be friends</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => handleAccept(req.id)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center space-x-1"
                                >
                                    <Check size={14} />
                                    <span>Accept</span>
                                </button>
                                <button 
                                    onClick={() => handleReject(req.id)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1.5 rounded flex items-center justify-center space-x-1"
                                >
                                    <X size={14} />
                                    <span>Reject</span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        <div className="border-t border-gray-200 pt-4">
             <Link to="#" className="flex items-center space-x-3 px-2 py-2 rounded-md text-gray-600 hover:bg-gray-50">
                <HelpCircle size={20} />
                <span className="text-sm font-medium">Help Center</span>
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;