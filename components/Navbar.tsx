import React from 'react';
import { Search, Plus, Bell, MessageCircle, Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { logout } from '../services/dataService';

interface NavbarProps {
  currentUser: User;
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, onToggleSidebar }) => {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 justify-between">
      {/* Logo & Mobile Menu */}
      <div className="flex items-center space-x-2">
        <button onClick={onToggleSidebar} className="lg:hidden p-1 hover:bg-gray-100 rounded">
            <Menu size={24} />
        </button>
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-orange-600 rounded-full p-1.5">
             <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="hidden sm:block text-xl font-bold tracking-tight">SocialRedd</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
            </div>
            <input 
                type="text" 
                placeholder="Search SocialRedd" 
                className="block w-full pl-10 pr-3 py-1.5 border border-gray-200 rounded-full leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-1 sm:space-x-3">
        <button className="hidden sm:flex items-center space-x-1 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition">
             <Plus size={18} />
             <span className="text-sm font-medium">Create</span>
        </button>

        <div className="flex items-center space-x-1 text-gray-500">
            <button className="p-2 hover:bg-gray-100 rounded-full">
                <Bell size={20} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
                <MessageCircle size={20} />
            </button>
        </div>

        {/* Profile Dropdown Trigger (Simplified) */}
        <div className="flex items-center">
            <Link to={`/user/${currentUser.id}`} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 ml-2">
                <div className="relative">
                    <img src={currentUser.avatar} alt="Profile" className="w-8 h-8 rounded-md bg-gray-200 object-cover" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="hidden lg:block text-left text-xs">
                    <p className="font-bold text-gray-700 truncate w-24">{currentUser.displayName}</p>
                </div>
            </Link>
            
            <button 
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-500 hover:bg-gray-100 rounded-full hover:text-red-600 transition-colors"
                title="Log Out"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;