import { useState, useEffect } from 'react';
import { Sparkles, ChefHat, TrendingUp, Smile, BookOpen, Newspaper } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail_url: string | null;
  template_data: any;
}

const CATEGORY_ICONS: Record<string, any> = {
  cooking: ChefHat,
  trends: TrendingUp,
  reactions: Smile,
  education: BookOpen,
  comedy: Smile,
  news: Newspaper,
};

export function TemplatesGallery({ onSelectTemplate }: { onSelectTemplate: (template: Template) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('project_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: 'الكل',
      cooking: 'الطبخ',
      trends: 'الترندات',
      reactions: 'ردود الفعل',
      education: 'تعليمي',
      comedy: 'كوميديا',
      news: 'أخبار',
    };
    return labels[category] || category;
  };

  return (
    <div className="templates-gallery">
      <div className="gallery-header">
        <Sparkles size={32} />
        <h2>المشاريع الجاهزة</h2>
        <p>اختر قالباً جاهزاً وابدأ في إنشاء محتواك</p>
      </div>

      <div className="category-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">جاري التحميل...</div>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map(template => {
            const Icon = CATEGORY_ICONS[template.category] || Sparkles;
            return (
              <div
                key={template.id}
                className="template-card"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="template-thumbnail">
                  {template.thumbnail_url ? (
                    <img src={template.thumbnail_url} alt={template.name} />
                  ) : (
                    <div className="template-icon">
                      <Icon size={48} />
                    </div>
                  )}
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <span className="template-category">{getCategoryLabel(template.category)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredTemplates.length === 0 && (
        <div className="empty-state">
          <p>لا توجد قوالب متاحة في هذا التصنيف</p>
        </div>
      )}
    </div>
  );
}
