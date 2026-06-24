import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import ProfilePanel from '../components/chat/ProfilePanel';
import { useTheme } from '../hooks/useTheme';

export default function ChatPage() {
  const { selectedUser } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { theme, toggleTheme } = useTheme();
  const [profileUser, setProfileUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [mobileView, setMobileView] = useState('sidebar'); // 'sidebar' | 'chat'

  // On mobile: switch to chat view when a user is selected
  useEffect(() => {
    if (selectedUser) setMobileView('chat');
  }, [selectedUser]);

  const handleShowProfile = (u) => {
    setProfileUser(u);
    setIsOwnProfile(u?._id === user?._id);
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setProfileUser(null);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-zinc-50 dark:bg-zinc-925 relative">
      {/* Theme toggle — floating */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-xl bg-white dark:bg-zinc-800
          border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center
          text-base hover:scale-110 transition-all"
        title="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── SIDEBAR ── */}
      <div className={`${mobileView === 'sidebar' ? 'flex' : 'hidden'} md:flex flex-shrink-0`}>
        <Sidebar onShowProfile={handleShowProfile} />
      </div>

      {/* ── CHAT WINDOW ── */}
      <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 flex-col`}>
        {/* Mobile back button */}
        {mobileView === 'chat' && selectedUser && (
          <button
            onClick={() => setMobileView('sidebar')}
            className="md:hidden absolute top-3 left-4 z-10 btn-icon bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700"
          >
            ←
          </button>
        )}
        <ChatWindow onShowProfile={handleShowProfile} />
      </div>

      {/* ── PROFILE PANEL ── */}
      {showProfile && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
            onClick={handleCloseProfile}
          />
          <div className="fixed right-0 top-0 h-full z-40 md:relative md:z-auto shadow-2xl md:shadow-none">
            <ProfilePanel
              viewUser={profileUser}
              isOwnProfile={isOwnProfile}
              onClose={handleCloseProfile}
            />
          </div>
        </>
      )}
    </div>
  );
}
