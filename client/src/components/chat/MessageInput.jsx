import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import EmojiPicker from 'emoji-picker-react';
import { useSocket } from '../../context/SocketContext';
import { fileToBase64 } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function MessageInput({ replyTo, onClearReply, editingMsg, onCancelEdit }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const fileRef = useRef(null);
  const { selectedUser } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { sendMessage, emitTyping, editMessage: socketEdit } = useSocket();
  const isDark = document.documentElement.classList.contains('dark');

  // Pre-fill when editing
  useEffect(() => {
    if (editingMsg) {
      setText(editingMsg.text);
      inputRef.current?.focus();
    }
  }, [editingMsg]);

  const handleTyping = useCallback((val) => {
    setText(val);
    if (!selectedUser) return;
    emitTyping(selectedUser._id, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(selectedUser._id, false), 1200);
  }, [selectedUser, emitTyping]);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const base64 = await fileToBase64(file);
    setImagePreview(URL.createObjectURL(file));
    setImageBase64(base64);
    setShowEmoji(false);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageBase64) return;
    if (!selectedUser) return;

    setSending(true);
    try {
      if (editingMsg) {
        // Edit mode
        socketEdit({ messageId: editingMsg._id, text: trimmed, receiverId: selectedUser._id });
        onCancelEdit?.();
      } else {
        // Send new message via socket
        sendMessage({
          receiverId: selectedUser._id,
          text: trimmed,
          image: imageBase64 || '',
          replyTo: replyTo?._id || null,
        });
        onClearReply?.();
      }
      setText('');
      clearImage();
      emitTyping(selectedUser._id, false);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onCancelEdit?.();
      onClearReply?.();
    }
  };

  if (!selectedUser) return null;

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 pl-3 border-l-2 border-iris-500">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-iris-600 dark:text-iris-400">Replying to</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{replyTo.text || '📷 Image'}</p>
          </div>
          <button onClick={onClearReply} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Edit banner */}
      {editingMsg && (
        <div className="flex items-center gap-2 mb-2 pl-3 border-l-2 border-amber-500">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Editing message</p>
            <p className="text-xs text-zinc-500 truncate">{editingMsg.text}</p>
          </div>
          <button onClick={onCancelEdit} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img src={imagePreview} alt="preview" className="h-24 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
          <button onClick={clearImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
            ×
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="btn-icon text-xl"
            title="Emoji"
          >
            😊
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
              <EmojiPicker
                onEmojiClick={(e) => { setText(t => t + e.emoji); setShowEmoji(false); inputRef.current?.focus(); }}
                theme={isDark ? 'dark' : 'light'}
                height={380}
                width={320}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>

        {/* Image upload */}
        <button onClick={() => fileRef.current?.click()} className="btn-icon text-xl" title="Send image">
          📎
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="input resize-none overflow-hidden py-2.5 pr-4 max-h-32 leading-relaxed"
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !imageBase64)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all
            ${text.trim() || imageBase64
              ? 'bg-iris-600 hover:bg-iris-500 text-white shadow-iris active:scale-95'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Click outside to close emoji */}
      {showEmoji && <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />}
    </div>
  );
}
