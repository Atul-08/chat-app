import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, setSelectedUser, fetchUnreadCounts, setSearchQuery } from '../../store/slices/chatSlice';
import { logout } from '../../store/slices/authSlice';
import { userAPI } from '../../services/api';
import Avatar from '../common/Avatar';
import { SkeletonContact } from '../common/Skeleton';
import { formatLastSeen } from '../../utils/helpers';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Sidebar({ onShowProfile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, usersLoading, selectedUser, unreadCounts, searchQuery } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { typingUsers, emitFriendAccepted } = useSocket();
  const [tab, setTab] = useState('all'); // all | friends | requests
  const [localSearch, setLocalSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers({ search: localSearch || undefined }));
    dispatch(fetchUnreadCounts());
  }, [localSearch]);

  // Periodic unread refresh
  useEffect(() => {
    const iv = setInterval(() => dispatch(fetchUnreadCounts()), 15000);
    return () => clearInterval(iv);
  }, []);

  const handleSelect = (u) => dispatch(setSelectedUser(u));

  const handleAccept = async (senderId) => {
    setProcessingId(senderId);
    try {
      await userAPI.acceptFriendRequest(senderId);
      emitFriendAccepted(senderId);
      toast.success('Friend request accepted! 🎉');
      dispatch(fetchUsers({}));
    } catch { toast.error('Failed'); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (senderId) => {
    setProcessingId(senderId + '-reject');
    try {
      await userAPI.rejectFriendRequest(senderId);
      toast.success('Request rejected');
      dispatch(fetchUsers({}));
    } catch { toast.error('Failed'); }
    finally { setProcessingId(null); }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const friendIds = new Set((user?.friends || []).map(f => f._id || f));
  const friendRequestIds = (user?.friendRequests || []);

  let displayUsers = users;
  if (tab === 'friends') {
    displayUsers = users.filter(u => friendIds.has(u._id));
  } else if (tab === 'requests') {
    displayUsers = [];
  }

  const onlineCount = users.filter(u => u.isOnline).length;

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            💬 ChatApp
          </h1>
          <div className="flex items-center gap-1">
            <button onClick={() => onShowProfile?.(user)} className="btn-icon" title="My Profile">
              <Avatar user={user} size="sm" />
            </button>
            <button onClick={handleLogout} className="btn-icon text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Logout">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search users..."
            className="input pl-9 py-2 text-sm"
          />
        </div>

        {/* Online badge */}
        <div className="flex items-center gap-2 mt-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{onlineCount} online</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 mx-4">
        {[
          { key: 'all', label: 'All' },
          { key: 'friends', label: 'Friends' },
          { key: 'requests', label: 'Requests', badge: friendRequestIds.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold relative transition-colors
              ${tab === t.key
                ? 'text-iris-600 dark:text-iris-400 border-b-2 border-iris-600 dark:border-iris-400 -mb-px'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="badge ml-1 text-[9px]">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {/* Friend Requests tab */}
        {tab === 'requests' && (
          <>
            {friendRequestIds.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                <p className="text-3xl mb-2">👋</p>
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              friendRequestIds.map((req) => {
                const reqUser = typeof req === 'object' ? req : { _id: req, username: req };
                return (
                  <div key={reqUser._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                    <Avatar user={reqUser} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                        {reqUser.username}
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        <button
                          onClick={() => handleAccept(reqUser._id)}
                          disabled={processingId === reqUser._id}
                          className="px-3 py-1 bg-iris-600 hover:bg-iris-500 text-white text-xs rounded-lg font-semibold disabled:opacity-50">
                          {processingId === reqUser._id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleReject(reqUser._id)}
                          disabled={processingId === reqUser._id + '-reject'}
                          className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs rounded-lg font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Users list */}
        {tab !== 'requests' && (
          <>
            {usersLoading ? (
              [...Array(6)].map((_, i) => <SkeletonContact key={i} />)
            ) : displayUsers.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                <p className="text-3xl mb-2">👤</p>
                <p className="text-sm">{tab === 'friends' ? 'No friends yet' : 'No users found'}</p>
              </div>
            ) : (
              displayUsers.map((u) => {
                const isSelected = selectedUser?._id === u._id;
                const unread = unreadCounts[u._id] || 0;
                const isFriend = friendIds.has(u._id);
                const isTy = typingUsers[u._id];

                return (
                  <button
                    key={u._id}
                    onClick={() => handleSelect(u)}
                    className={`contact-item w-full ${isSelected ? 'active' : ''}`}
                  >
                    <Avatar user={u} size="md" showOnline />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-iris-700 dark:text-iris-300' : 'text-zinc-800 dark:text-zinc-100'}`}>
                          {u.username}
                        </span>
                        {unread > 0 && <span className="badge flex-shrink-0">{unread}</span>}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-iris-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {isTy
                          ? <span className="text-iris-500 font-medium">typing…</span>
                          : u.bio || (u.isOnline ? 'Online' : `Last seen ${formatLastSeen(u.lastSeen)}`)}
                      </p>
                    </div>
                    {!isFriend && tab === 'all' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await userAPI.sendFriendRequest(u._id);
                            toast.success('Friend request sent!');
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed');
                          }
                        }}
                        className="flex-shrink-0 text-xs text-iris-500 hover:text-iris-700 dark:hover:text-iris-300 font-medium px-1"
                        title="Add friend"
                      >
                        +
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Current user footer */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <Avatar user={user} size="sm" showOnline />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{user?.username}</p>
          <p className="text-[10px] text-emerald-500 font-medium">● Online</p>
        </div>
      </div>
    </aside>
  );
}
