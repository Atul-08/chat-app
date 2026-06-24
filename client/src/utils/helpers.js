import { format, isToday, isYesterday, formatDistanceToNow, differenceInMinutes } from 'date-fns';

export const formatMsgTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return format(d, 'hh:mm a');
};

export const formatChatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy');
};

export const formatLastSeen = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (differenceInMinutes(new Date(), d) < 1) return 'just now';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentDate = null;

  messages.forEach((msg) => {
    const msgDate = formatChatDate(msg.createdAt);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ type: 'date', label: msgDate, id: `date-${msg.createdAt}` });
    }
    groups.push({ type: 'message', ...msg });
  });

  return groups;
};

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const generateAvatarColor = (str = '') => {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Convert file to base64
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

// Status icon
export const getMsgStatusIcon = (status) => {
  if (status === 'seen')      return '✓✓';
  if (status === 'delivered') return '✓✓';
  return '✓';
};

export const getMsgStatusColor = (status) =>
  status === 'seen' ? 'text-sky-400' : 'text-white/50';
