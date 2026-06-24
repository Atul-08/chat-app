import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, logout } from '../../store/slices/authSlice';
import Avatar from '../common/Avatar';
import { fileToBase64, formatLastSeen } from '../../utils/helpers';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePanel({ viewUser, isOwnProfile, onClose }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const [editing, setEditing] = useState(false);
  const [form, setForm]   = useState({ username: user?.username || '', bio: user?.bio || '' });
  const [preview, setPreview] = useState(null);
  const [imgBase64, setImgBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const displayUser = isOwnProfile ? user : viewUser;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setImgBase64(await fileToBase64(file));
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = { ...form };
    if (imgBase64) payload.profilePicBase64 = imgBase64;
    await dispatch(updateProfile(payload));
    setEditing(false);
    setPreview(null);
    setImgBase64(null);
    setLoading(false);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      await userAPI.removeFriend(displayUser._id);
      toast.success('Friend removed');
      onClose?.();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 h-full animate-slideRight">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="font-display font-bold text-zinc-900 dark:text-white">
          {isOwnProfile ? 'My Profile' : 'Profile'}
        </h2>
        <button onClick={onClose} className="btn-icon">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar section */}
        <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-b from-iris-50 dark:from-iris-950/30 to-transparent">
          <div className="relative">
            <Avatar user={{ ...displayUser, profilePic: preview || displayUser?.profilePic }} size="2xl" showOnline={!isOwnProfile} />
            {isOwnProfile && editing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer">
                <span className="text-white text-2xl">📷</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {editing ? (
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input text-center font-bold text-lg mt-4 w-full max-w-[200px]"
            />
          ) : (
            <h3 className="font-display font-bold text-xl text-zinc-900 dark:text-white mt-4">
              {displayUser?.username}
            </h3>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {displayUser?.isOnline
              ? <span className="text-emerald-500 font-semibold">● Online</span>
              : `Last seen ${formatLastSeen(displayUser?.lastSeen)}`}
          </p>
        </div>

        {/* Bio */}
        <div className="px-4 pb-4">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Bio</p>
          {editing ? (
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="input resize-none h-20 text-sm"
              placeholder="Tell something about yourself..."
              maxLength={150}
            />
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {displayUser?.bio || <span className="italic text-zinc-400 dark:text-zinc-500">No bio yet</span>}
            </p>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Info</p>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 space-y-2">
            {[
              { label: 'Email', value: displayUser?.email },
              { label: 'Friends', value: displayUser?.friends?.length || 0 },
              { label: 'Member since', value: displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        {isOwnProfile ? (
          editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-ghost flex-1 text-sm py-2">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 text-sm py-2">
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-primary w-full text-sm py-2.5">
                ✏️ Edit Profile
              </button>
              <button onClick={handleLogout} className="btn-ghost w-full text-sm py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                🚪 Logout
              </button>
            </>
          )
        ) : (
          <>
            {(user?.friends || []).map(f => f._id || f).includes(displayUser?._id) && (
              <button onClick={handleRemoveFriend} className="btn-ghost w-full text-sm py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                Remove Friend
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
