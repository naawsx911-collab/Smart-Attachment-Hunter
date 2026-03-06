import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function RegisterForm({ onToggle }: { onToggle: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signUp(email, password, username, displayName);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-form">
      <h2>إنشاء حساب جديد</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>الاسم الكامل</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="أدخل اسمك الكامل"
          />
        </div>
        <div className="form-group">
          <label>اسم المستخدم</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="اختر اسم مستخدم"
          />
        </div>
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
            minLength={6}
            placeholder="اختر كلمة مرور قوية"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
        </button>
      </form>
      <p className="toggle-text">
        لديك حساب بالفعل؟{' '}
        <button onClick={onToggle} className="link-button">
          سجل الدخول
        </button>
      </p>
    </div>
  );
}
