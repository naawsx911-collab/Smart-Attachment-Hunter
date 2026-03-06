import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { VideoCreatorForm } from './components/VideoCreator/VideoCreatorForm';
import { GeneralChat } from './components/Chat/GeneralChat';
import { PrivateMessages } from './components/Chat/PrivateMessages';
import { TemplatesGallery } from './components/Templates/TemplatesGallery';
import { AdBanner } from './components/Ads/AdBanner';
import { Video, MessageCircle, Mail, Sparkles, LogOut, Menu } from 'lucide-react';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Video size={48} />
          <h1>Smart Attachment Hunter</h1>
          <p>حول أفكارك إلى مقاطع فيديو مذهلة</p>
        </div>
        {isLogin ? (
          <LoginForm onToggle={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggle={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}

function MainLayout() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="main-layout">
      <AdBanner position="top" />

      <nav className="main-nav">
        <div className="nav-brand">
          <Video size={32} />
          <span>Smart Attachment Hunter</span>
        </div>

        <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <Menu size={24} />
        </button>

        <div className={`nav-links ${showMobileMenu ? 'show' : ''}`}>
          <button
            className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveTab('create'); setShowMobileMenu(false); }}
          >
            <Video size={20} />
            <span>إنشاء فيديو</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => { setActiveTab('templates'); setShowMobileMenu(false); }}
          >
            <Sparkles size={20} />
            <span>المشاريع الجاهزة</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => { setActiveTab('chat'); setShowMobileMenu(false); }}
          >
            <MessageCircle size={20} />
            <span>المحادثة العامة</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => { setActiveTab('messages'); setShowMobileMenu(false); }}
          >
            <Mail size={20} />
            <span>الرسائل الخاصة</span>
          </button>
          <button className="nav-link logout-btn" onClick={signOut}>
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="content-wrapper">
          {activeTab === 'create' && <VideoCreatorForm />}
          {activeTab === 'templates' && <TemplatesGallery onSelectTemplate={() => setActiveTab('create')} />}
          {activeTab === 'chat' && <GeneralChat />}
          {activeTab === 'messages' && <PrivateMessages />}
        </div>
        <aside className="sidebar">
          <AdBanner position="sidebar" />
        </aside>
      </main>

      <AdBanner position="bottom" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<MainLayout />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
