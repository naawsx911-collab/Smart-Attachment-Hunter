import { useState } from 'react';
import { Ban, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface BlockUserProps {
  userId: string;
  username: string;
  onBlockComplete?: () => void;
}

export function BlockUser({ userId, username, onBlockComplete }: BlockUserProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleBlock = async () => {
    if (!user || user.id === userId) return;

    setLoading(true);
    const { error } = await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: userId,
      reason: reason.trim(),
    });

    if (!error) {
      setShowModal(false);
      setReason('');
      onBlockComplete?.();
    }
    setLoading(false);
  };

  return (
    <>
      <button
        className="btn-block"
        onClick={() => setShowModal(true)}
        title="حظر المستخدم"
      >
        <Ban size={16} />
        حظر
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Shield size={24} />
              <h3>حظر المستخدم</h3>
            </div>
            <div className="modal-body">
              <p>هل أنت متأكد من حظر @{username}؟</p>
              <div className="form-group">
                <label>سبب الحظر (اختياري)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="اكتب سبب الحظر..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                إلغاء
              </button>
              <button
                className="btn-danger"
                onClick={handleBlock}
                disabled={loading}
              >
                {loading ? 'جاري الحظر...' : 'تأكيد الحظر'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
