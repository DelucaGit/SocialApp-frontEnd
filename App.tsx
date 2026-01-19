import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import UserProfile from './components/UserProfile';
import PostDetail from './components/PostDetail';
import { getCurrentUser } from './services/dataService';
import { User } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to load user", error);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DAE0E6]">
        <div className="flex flex-col items-center space-y-2 text-gray-500">
           <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
           <p className="text-sm font-medium">Loading SocialRedd...</p>
        </div>
      </div>
    );
  }

  // If loading failed or no user is returned (simulating auth requirement)
  if (!currentUser) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-[#DAE0E6]">
          <p className="text-red-500">Failed to load application data. Please try again later.</p>
       </div>
     );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#DAE0E6]">
        {/* Navigation */}
        <Navbar 
          currentUser={currentUser} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        <div className="flex flex-1 relative">
          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} />
          
          {/* Overlay for mobile sidebar */}
          {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
          )}

          {/* Main Content */}
          <main className="flex-1 w-full p-0 sm:p-4 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              {/* Fallback routes */}
              <Route path="*" element={<Feed />} />
            </Routes>
          </main>
          
          {/* Right Sidebar (Desktop only - Reddit style) */}
          <aside className="hidden xl:block w-80 p-4 space-y-4">
             <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm">
                 <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Home</h2>
                 <p className="text-sm text-gray-700 mb-4">Your personal SocialRedd frontpage. Come here to check in with your favorite people.</p>
                 <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-full transition text-sm">Create Post</button>
             </div>
             
             <div className="text-xs text-gray-500 px-2">
                 <div className="flex flex-wrap gap-2 mb-2">
                     <a href="#" className="hover:underline">User Agreement</a>
                     <a href="#" className="hover:underline">Privacy Policy</a>
                 </div>
                 <p>© 2024 SocialRedd Inc. All rights reserved.</p>
             </div>
          </aside>
        </div>
      </div>
    </Router>
  );
};

export default App;