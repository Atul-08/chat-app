import Avatar from './Avatar';

export default function TypingIndicator({ user }) {
  return (
    <div className="flex items-end gap-2 animate-fadeIn px-4 py-1">
      <Avatar user={user} size="sm" />
      <div className="msg-in flex items-center gap-1 py-3 px-4">
        <span className="typing-dot animate-typingDot1" />
        <span className="typing-dot animate-typingDot2" />
        <span className="typing-dot animate-typingDot3" />
      </div>
    </div>
  );
}
