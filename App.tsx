import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import UserProfile from './components/UserProfile';
import PostDetail from './components/PostDetail';
import Login from './components/Login';
import Register from './components/Register';
import { getCurrentUser } from './services/dataService';
import { User } from './types';
import { Loader2 } from 'lucide-react';

const ProtectedLayout: React.FC<{ currentUser: User | null, children: React.ReactNode }> = ({ currentUser, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#DAE0E6]">
      {/* Navigation */}
      <Navbar 
        currentUser={currentUser} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} currentUser={currentUser} />
        
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 w-full p-0 sm:p-4 overflow-x-hidden">
          {children}
        </main>
        
        {/* Right Sidebar (Desktop only - Reddit style) */}
        <aside className="hidden xl:block w-80 p-4 space-y-4">
           <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm">
               <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Home</h2>
               <p className="text-sm text-gray-700 mb-4">Your personal SocialRedd frontpage. Come here to check in with your favorite people.</p>
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
  );
};

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load user", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
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

  return (
    <Routes>
      <Route path="/login" element={<Login onLoginSuccess={fetchUser} />} />
      <Route path="/register" element={<Register onRegisterSuccess={fetchUser} />} />
      
      <Route path="/" element={
        <ProtectedLayout currentUser={currentUser}>
          <Feed currentUser={currentUser} />
        </ProtectedLayout>
      } />
      
      <Route path="/post/:postId" element={
        <ProtectedLayout currentUser={currentUser}>
          <PostDetail currentUser={currentUser} />
        </ProtectedLayout>
      } />
      
      <Route path="/user/:userId" element={
        <ProtectedLayout currentUser={currentUser}>
          <UserProfile currentUser={currentUser} />
        </ProtectedLayout>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;