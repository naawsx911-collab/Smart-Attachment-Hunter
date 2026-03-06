import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id: string;
  user_id: string;
  message_text: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function GeneralChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel('public-chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles (username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      message_text: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
    setLoading(false);
  };

  return (
    <div className="general-chat">
      <div className="chat-header">
        <h3>المحادثة العامة</h3>
        <span className="chat-status">متصل</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.user_id === user?.id ? 'own-message' : ''}`}
          >
            <div className="message-avatar">
              {msg.profiles.avatar_url ? (
                <img src={msg.profiles.avatar_url} alt={msg.profiles.display_name} />
              ) : (
                <div className="avatar-placeholder">
                  {msg.profiles.display_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-author">{msg.profiles.display_name}</span>
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {msg.message_text && <p className="message-text">{msg.message_text}</p>}
              {msg.image_url && (
                <img src={msg.image_url} alt="مرفق" className="message-image" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input">
        <button type="button" className="btn-icon">
          <ImageIcon size={20} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك..."
          disabled={loading}
        />
        <button type="submit" className="btn-send" disabled={loading || !newMessage.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
