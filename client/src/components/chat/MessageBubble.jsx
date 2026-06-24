import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import EmojiPicker from 'emoji-picker-react';
import { formatMsgTime, getMsgStatusIcon, getMsgStatusColor } from '../../utils/helpers';
import Avatar from '../common/Avatar';
import { useSocket } from '../../context/SocketContext';

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😠', '👍'];

export default function MessageBubble({ msg, showAvatar, onReply, onEdit }) {
  const { user } = useSelector((s) => s.auth);
  const { selectedUser } = useSelector((s) => s.chat);
  const { deleteMessage, reactToMessage } = useSocket();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const longPressTimer = useRef(null);

  const isOwn = msg.senderId === user?._id || msg.senderId?._id === user?._id;
  const isDeleted = msg.isDeleted;

  const handleDelete = () => {
    if (!window.confirm('Delete this message?')) return;
    deleteMessage({ messageId: msg._id, receiverId: selectedUser?._id });
    setShowActions(false);
  };

  const handleReact = (emoji) => {
    reactToMessage({ messageId: msg._id, emoji, receiverId: isOwn ? selectedUser?._id : user?._id });
    setShowEmojiPicker(false);
    setShowActions(false);
  };

  // Group reactions by emoji
  const reactionGroups = (msg.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});
  const myReaction = (msg.reactions || []).find(r => r.userId === user?._id)?.emoji;

  // Long press for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowActions(true), 500);
  };
  const handleTouchEnd = () => clearTimeout(longPressTimer.current);

  return (
    <div
      className={`group flex items-end gap-2 px-3 py-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0 mb-1">
          {showAvatar && <Avatar user={selectedUser} size="sm" />}
        </div>
      )}

      <div className={`flex flex-col max-w-xs sm:max-w-sm md:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Reply preview */}
        {msg.replyTo && !msg.replyTo.isDeleted && (
          <div className={`text-xs px-3 py-1.5 rounded-xl mb-1 border-l-2 max-w-full truncate
            ${isOwn
              ? 'border-white/40 bg-iris-700 text-iris-100'
              : 'border-iris-400 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
            {msg.replyTo.text || '📷 Image'}
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            className={`${isOwn ? 'msg-out' : 'msg-in'} ${isDeleted ? 'msg-deleted' : ''} relative`}
          >
            {isDeleted ? (
              <span className="italic text-sm opacity-60">This message was deleted</span>
            ) : (
              <>
                {msg.image && (
                  <div className={`mb-1 rounded-xl overflow-hidden ${!imgLoaded ? 'bg-zinc-200 dark:bg-zinc-700 animate-pulse w-48 h-36' : ''}`}>
                    <img
                      src={msg.image}
                      alt="shared"
                      className={`max-w-full rounded-xl max-h-64 object-contain transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                      onLoad={() => setImgLoaded(true)}
                    />
                  </div>
                )}
                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                {msg.isEdited && (
                  <span className="text-[10px] opacity-50 ml-1">(edited)</span>
                )}
              </>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(reactionGroups).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-all
                    ${myReaction === emoji
                      ? 'bg-iris-100 dark:bg-iris-900/40 border-iris-400 dark:border-iris-600'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                    } hover:scale-110`}
                >
                  {emoji} {count > 1 && <span className="text-zinc-500 dark:text-zinc-400">{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time + status */}
        <div className={`flex items-center gap-1 mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span>{formatMsgTime(msg.createdAt)}</span>
          {isOwn && !isDeleted && (
            <span className={getMsgStatusColor(msg.status)}>{getMsgStatusIcon(msg.status)}</span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {showActions && !isDeleted && (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-2 ${isOwn ? 'flex-row-reverse mr-1' : 'ml-1'}`}>
          {/* Quick reactions */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 px-2 py-1">
            {QUICK_EMOJIS.map(e => (
              <button key={e} onClick={() => handleReact(e)}
                className="text-base hover:scale-125 transition-transform">{e}</button>
            ))}
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-base text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-1">
              ＋
            </button>
          </div>

          {/* Reply */}
          <button onClick={() => onReply?.(msg)} className="btn-icon w-8 h-8 text-sm">↩</button>

          {/* Edit (own messages) */}
          {isOwn && msg.text && (
            <button onClick={() => onEdit?.(msg)} className="btn-icon w-8 h-8 text-sm">✏️</button>
          )}

          {/* Delete (own messages) */}
          {isOwn && (
            <button onClick={handleDelete} className="btn-icon w-8 h-8 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">🗑</button>
          )}
        </div>
      )}

      {/* Full emoji picker */}
      {showEmojiPicker && (
        <div className={`absolute z-50 ${isOwn ? 'right-12' : 'left-12'} bottom-0`}>
          <EmojiPicker
            onEmojiClick={(e) => handleReact(e.emoji)}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            height={350}
            width={300}
            searchDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}
