import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import { Camera, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'Demo User', email: 'demo@pixora.app', role: 'Curator' },
  { name: 'Elena Vance', email: 'elena@pixora.app', role: 'Nature Photographer' },
  { name: 'Marcus Chen', email: 'marcus@pixora.app', role: 'Architect' },
];

export default function Login() {
  const { login } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      addToast('Welcome back to Pixora!', 'success');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMsg('');
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 0'
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#14171f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '36px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            className="brand-icon-wrapper"
            style={{ margin: '0 auto 16px', width: '48px', height: '48px' }}
          >
            <Camera size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Welcome to Pixora
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>
            Sign in to discover, collect, and share high-res photography.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fda4af',
              fontSize: '0.88rem',
              marginBottom: '20px'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <Mail
                size={18}
                style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <Lock
                size={18}
                style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', height: '44px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#f59e0b',
              marginBottom: '10px'
            }}
          >
            <Sparkles size={14} />
            <span>Quick Demo Evaluation Accounts (Auto-fill)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  justifyContent: 'space-between'
                }}
                onClick={() => handleSelectDemo(demo.email)}
              >
                <span>{demo.name} ({demo.role})</span>
                <span style={{ color: '#38bdf8' }}>{demo.email}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#94a3b8' }}>
          Don&apos;t have an account yet?{' '}
          <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600 }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
