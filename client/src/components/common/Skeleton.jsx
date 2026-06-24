export const SkeletonContact = () => (
  <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
      <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
    </div>
  </div>
);

export const SkeletonMessage = ({ out = false }) => (
  <div className={`flex items-end gap-2 px-4 animate-pulse ${out ? 'flex-row-reverse' : ''}`}>
    {!out && <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />}
    <div
      className={`h-10 rounded-2xl ${out ? 'bg-iris-200 dark:bg-iris-900/40' : 'bg-zinc-200 dark:bg-zinc-700'}`}
      style={{ width: `${120 + Math.random() * 100}px` }}
    />
  </div>
);

export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };
  return (
    <div className={`animate-spin rounded-full border-zinc-200 border-t-iris-600 ${s[size]} ${className}`} />
  );
};

export default function SkeletonScreen() {
  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <SkeletonMessage key={i} out={i % 3 === 0} />
      ))}
    </div>
  );
}
