import { useEffect, useState } from 'react';

interface AdBannerProps {
  position: 'top' | 'bottom' | 'sidebar';
  className?: string;
}

export function AdBanner({ position, className = '' }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`ad-banner ad-${position} ${className}`}>
      <div className="ad-content">
        <div className="ad-label">إعلان</div>
        <div className="ad-placeholder">
          <p>مساحة إعلانية</p>
          <span>الخدمة مجانية بفضل الإعلانات</span>
        </div>
      </div>
    </div>
  );
}
