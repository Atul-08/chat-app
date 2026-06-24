import { getInitials, generateAvatarColor } from '../../utils/helpers';

export default function Avatar({ user, size = 'md', showOnline = false, className = '' }) {
  const sizes = {
    xs:  'w-7 h-7 text-xs',
    sm:  'w-8 h-8 text-xs',
    md:  'w-10 h-10 text-sm',
    lg:  'w-12 h-12 text-base',
    xl:  'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };
  const dotSizes = {
    xs: 'w-2 h-2 border',
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
    '2xl': 'w-5 h-5 border-2',
  };

  const name = user?.username || user?.name || '?';
  const bgColor = generateAvatarColor(name);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {user?.profilePic ? (
        <img
          src={user.profilePic}
          alt={name}
          className={`avatar ${sizes[size]}`}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        className={`avatar ${sizes[size]} ${bgColor} text-white font-bold flex items-center justify-center ${user?.profilePic ? 'hidden' : 'flex'}`}
      >
        {getInitials(name)}
      </div>
      {showOnline && (
        <span className={`online-dot absolute bottom-0 right-0 ${dotSizes[size]}
          ${user?.isOnline ? 'bg-emerald-500 ring-1 ring-emerald-400' : 'bg-zinc-400 ring-0'}
          rounded-full border-white dark:border-zinc-900`}
        />
      )}
    </div>
  );
}
