import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginForm({ onToggle }: { onToggle: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-form">
      <h2>تسجيل الدخول</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="أدخل بريدك الإلكتروني"
          />
        </div>
        <div className="form-group">
          <label>كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="أدخل كلمة المرور"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
        </button>
      </form>
      <p className="toggle-text">
        ليس لديك حساب؟{' '}
        <button onClick={onToggle} className="link-button">
          سجل الآن
        </button>
      </p>
    </div>
  );
}
