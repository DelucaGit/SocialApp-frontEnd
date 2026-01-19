import React from 'react';
import { Home, TrendingUp, HelpCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
    isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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