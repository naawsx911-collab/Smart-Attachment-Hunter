import { useState } from 'react';
import { Upload, Wand2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const DIALECTS = [
  { value: 'standard', label: 'العربية الفصحى' },
  { value: 'egyptian', label: 'المصرية' },
  { value: 'saudi', label: 'السعودية' },
  { value: 'levantine', label: 'الشامية' },
  { value: 'gulf', label: 'الخليجية' },
  { value: 'maghrebi', label: 'المغاربية' },
];

const VOICE_TONES = [
  { value: 'neutral', label: 'محايد' },
  { value: 'friendly', label: 'ودود' },
  { value: 'professional', label: 'احترافي' },
  { value: 'energetic', label: 'حماسي' },
  { value: 'calm', label: 'هادئ' },
];

export function VideoCreatorForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [dialect, setDialect] = useState('standard');
  const [voiceTone, setVoiceTone] = useState('neutral');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('video-sources')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('video-sources')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase.from('videos').insert({
        user_id: user.id,
        title,
        description,
        source_text: text,
        source_image_url: imageUrl,
        dialect,
        voice_tone: voiceTone,
        status: 'processing',
      });

      if (insertError) throw insertError;

      setSuccess('تم إنشاء الفيديو بنجاح! جاري المعالجة...');
      setTitle('');
      setText('');
      setDescription('');
      setImageFile(null);
      setImagePreview('');
      setDialect('standard');
      setVoiceTone('neutral');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الفيديو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-creator-form">
      <div className="form-header">
        <Wand2 size={32} />
        <h2>إنشاء فيديو بالذكاء الاصطناعي</h2>
        <p>حول نصوصك وصورك إلى مقاطع فيديو مذهلة بجودة HD</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-group">
          <label>عنوان الفيديو *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="أدخل عنواناً جذاباً للفيديو"
          />
        </div>

        <div className="form-group">
          <label>النص المراد تحويله *</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={6}
            placeholder="اكتب النص الذي تريد تحويله إلى فيديو..."
          />
        </div>

        <div className="form-group">
          <label>وصف الفيديو</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="أضف وصفاً للفيديو (اختياري)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>اللهجة العربية</label>
            <select value={dialect} onChange={(e) => setDialect(e.target.value)}>
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>نبرة الصوت</label>
            <select value={voiceTone} onChange={(e) => setVoiceTone(e.target.value)}>
              {VOICE_TONES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>رفع صورة (اختياري)</label>
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="image-upload"
              className="file-input"
            />
            <label htmlFor="image-upload" className="upload-label">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <>
                  <Upload size={48} />
                  <span>اضغط لرفع صورة</span>
                  <span className="upload-hint">سيتم الحفاظ على الملامح الأصلية</span>
                </>
              )}
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-large">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الفيديو'}
        </button>

        <p className="form-note">
          مدة الفيديو: 15 ثانية | الجودة: HD | الخدمة مجانية
        </p>
      </form>
    </div>
  );
}
