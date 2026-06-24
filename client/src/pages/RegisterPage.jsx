import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/slices/authSlice';
import { Spinner } from '../components/common/Skeleton';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    otp: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => { dispatch(clearError()); }, []);
  useEffect(() => { if (isAuthenticated) navigate('/chat', { replace: true }); }, [isAuthenticated]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const strength = (pw) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  };
  const str = strength(form.password);
  const strLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-600'];

  const sendOTP = async () => {
    try {
      await authAPI.sendOTP({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to send OTP'
      );
    }
  };

  const verifyOTP = async () => {
    try {
      await authAPI.verifyOTP({
        email: form.email,
        otp: form.otp,
      });

      setOtpVerified(true);
      toast.success('OTP verified');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Invalid OTP'
      );
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!otpVerified) {
      toast.error('Verify OTP first');
      return;
    }

    if (form.password !== form.confirm) {
      return;
    }

    dispatch(
      register({
        email: form.email,
      })
    );
  };

  const passwordMismatch = form.confirm && form.password !== form.confirm;

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-925">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0
        bg-gradient-to-br from-violet-700 via-iris-800 to-iris-950 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex items-center gap-3">
          <span className="text-3xl">💬</span>
          <span className="font-display font-bold text-2xl tracking-tight">ChatApp</span>
        </div>

        <div className="relative z-10 space-y-5">
          <h2 className="font-display font-bold text-4xl leading-tight">
            Join the<br />conversation.
          </h2>
          <p className="text-iris-200 leading-relaxed">
            Create a free account in seconds and start chatting with friends in real time.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { icon: '⚡', title: 'Instant messaging', desc: 'Messages delivered in real time via WebSocket' },
              { icon: '🖼️', title: 'Share images', desc: 'Send photos directly in your conversations' },
              { icon: '😊', title: 'Emoji reactions', desc: 'React to any message with your favorite emoji' },
            ].map((f) => (
              <div key={f.icon} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-iris-300 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-iris-400 text-sm">© {new Date().getFullYear()} ChatApp</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-fadeUp">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-3xl">💬</span>
            <span className="font-display font-bold text-2xl text-zinc-900 dark:text-white">ChatApp</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Create account</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5">Join ChatApp for free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.username} onChange={set('username')}
                className="input" placeholder="cooluser_123"
                minLength={3} maxLength={30} required
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores"
              />
              <p className="text-xs text-zinc-400 mt-1">Letters, numbers, underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>

              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className="input"
                placeholder="you@example.com"
                required
              />

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={sendOTP}
                  className="btn-primary"
                >
                  Send OTP
                </button>

                {otpSent && (
                  <span className="text-green-600 text-sm self-center">
                    OTP Sent ✓
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  className="input pr-12" placeholder="Min. 6 characters" minLength={6} required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-lg">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= str ? strColors[str] : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">{strLabels[str]}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password" value={form.confirm} onChange={set('confirm')}
                className={`input ${passwordMismatch ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="Re-enter your password" required
              />
              {passwordMismatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            {otpSent && (
              <>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    OTP
                  </label>

                  <input
                    type="text"
                    value={form.otp}
                    onChange={set('otp')}
                    className="input"
                    placeholder="Enter OTP"
                  />
                </div>

                <button
                  type="button"
                  onClick={verifyOTP}
                  className="btn-primary w-full"
                >
                  Verify OTP
                </button>

                {otpVerified && (
                  <p className="text-green-600 text-sm">
                    ✓ Email Verified
                  </p>
                )}
              </>
            )}
            
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading || !!passwordMismatch} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-iris-600 dark:text-iris-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
