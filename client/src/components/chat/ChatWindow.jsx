import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMessages } from '../../store/slices/chatSlice';
import { useSocket } from '../../context/SocketContext';
import { groupMessagesByDate } from '../../utils/helpers';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from '../common/TypingIndicator';
import SkeletonScreen, { Spinner } from '../common/Skeleton';
import Avatar from '../common/Avatar';
import { formatLastSeen } from '../../utils/helpers';

export default function ChatWindow({ onShowProfile }) {
  const dispatch  = useDispatch();
  const { selectedUser, messages, messagesLoading, hasMore } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { typingUsers, markSeen } = useSocket();
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const containerRef = useRef(null);
  const isTyping = selectedUser && typingUsers[selectedUser._id];

  // Fetch messages on user change
  useEffect(() => {
    if (!selectedUser) return;
    setPage(1);
    dispatch(fetchMessages({ userId: selectedUser._id, page: 1 }));
  }, [selectedUser?._id]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (page === 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, page]);

  // Mark unseen messages as seen
  useEffect(() => {
    if (!selectedUser || !messages.length) return;
    const unseenIds = messages
      .filter(m => m.senderId === selectedUser._id && m.status !== 'seen')
      .map(m => m._id);
    if (unseenIds.length) markSeen(selectedUser._id, unseenIds);
  }, [messages, selectedUser]);

  // Infinite scroll — load more when reaching top
  const handleScroll = useCallback(async () => {
    if (!containerRef.current || loadingMore || !hasMore) return;
    if (containerRef.current.scrollTop < 80) {
      setLoadingMore(true);
      const prevHeight = containerRef.current.scrollHeight;
      const nextPage = page + 1;
      await dispatch(fetchMessages({ userId: selectedUser._id, page: nextPage }));
      setPage(nextPage);
      // Restore scroll position
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight - prevHeight;
        }
      });
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, selectedUser]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-925 select-none">
        <div className="text-7xl mb-4 animate-wiggle">💬</div>
        <h2 className="text-xl font-display font-bold text-zinc-700 dark:text-zinc-300">
          Start a Conversation
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
          Select a contact from the sidebar to begin chatting
        </p>
      </div>
    );
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-925">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-sm">
        <button
          onClick={() => onShowProfile?.(selectedUser)}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
        >
          <div className="relative flex-shrink-0">
            <Avatar user={selectedUser} size="md" showOnline />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white truncate">{selectedUser.username}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
              {isTyping
                ? <span className="text-iris-500 font-medium">typing…</span>
                : selectedUser.isOnline
                  ? <span className="text-emerald-500 font-medium">Online</span>
                  : `Last seen ${formatLastSeen(selectedUser.lastSeen)}`
              }
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="btn-icon" title="Video call (coming soon)" disabled>📹</button>
          <button className="btn-icon" title="Voice call (coming soon)" disabled>📞</button>
          <button className="btn-icon" title="Search messages (coming soon)">🔍</button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-1"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(110,80,244,0.04) 1px, transparent 0)', backgroundSize: '28px 28px' }}
      >
        {/* Load more spinner */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        )}

        {messagesLoading && messages.length === 0 ? (
          <SkeletonScreen />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-zinc-400 dark:text-zinc-500">
            <span className="text-4xl mb-3">✉️</span>
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          grouped.map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={item.id} className="divider text-xs mx-4">
                  {item.label}
                </div>
              );
            }

            const prev = grouped[idx - 1];
            const showAvatar = !item.senderId || item.senderId !== grouped[idx + 1]?.senderId;

            return (
              <MessageBubble
                key={item._id}
                msg={item}
                showAvatar={showAvatar}
                onReply={setReplyTo}
                onEdit={setEditingMsg}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator user={selectedUser} />}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        editingMsg={editingMsg}
        onCancelEdit={() => setEditingMsg(null)}
      />
    </div>
  );
}
