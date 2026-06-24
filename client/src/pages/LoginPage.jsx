import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { Spinner } from '../components/common/Skeleton';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (isAuthenticated) navigate('/chat', { replace: true }); }, [isAuthenticated]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const fillDemo = (who) => {
    const demos = {
      alice: { email: 'alice@demo.com', password: 'demo1234' },
      bob:   { email: 'bob@demo.com',   password: 'demo1234' },
    };
    setForm(demos[who]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-925">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0
        bg-gradient-to-br from-iris-700 via-iris-800 to-iris-950 p-10 text-white relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <span className="text-3xl">💬</span>
            <span className="font-display font-bold text-2xl tracking-tight">ChatApp</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display font-bold text-4xl leading-tight">
            Real-time chat,<br />reimagined.
          </h2>
          <p className="text-iris-200 leading-relaxed text-base">
            Connect with friends instantly. Send messages, images, and reactions — all in real time.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['⚡ Real-time', '🔐 Secure', '📱 Responsive', '🌙 Dark Mode', '😊 Emoji support', '👥 Friend system'].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur border border-white/20">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-iris-400 text-sm">© {new Date().getFullYear()} ChatApp</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fadeUp">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-3xl">💬</span>
            <span className="font-display font-bold text-2xl text-zinc-900 dark:text-white">ChatApp</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Welcome back</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5">Sign in to continue chatting</p>
          </div>

          {/* Demo buttons */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'alice', label: '👩 Demo: Alice' },
              { key: 'bob',   label: '👨 Demo: Bob' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => fillDemo(key)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border-2 border-dashed
                  border-iris-300 dark:border-iris-700 text-iris-600 dark:text-iris-400
                  hover:bg-iris-50 dark:hover:bg-iris-900/20 transition-colors">
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email address
              </label>
              <input
                type="email" value={form.email} onChange={set('email')}
                className="input" placeholder="you@example.com" required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  className="input pr-12" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-iris-600 dark:text-iris-400 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
