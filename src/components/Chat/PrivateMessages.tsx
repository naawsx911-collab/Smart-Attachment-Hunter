import { useState, useEffect } from 'react';
import { MessageCircle, Mic, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Conversation {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  unread_count: number;
}

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  message_type: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function PrivateMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUser && user) {
      fetchMessages(selectedUser);
      markMessagesAsRead(selectedUser);

      const subscription = supabase
        .channel(`private-messages-${user.id}`)
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
            fetchMessages(selectedUser);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedUser, user]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .neq('id', user?.id)
      .limit(20);

    if (data) {
      setConversations(data.map(profile => ({
        ...profile,
        last_message: '',
        unread_count: 0,
      })));
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', user?.id)
      .eq('is_read', false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) return;

    setLoading(true);
    const { error } = await supabase.from('private_messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      message_text: newMessage.trim(),
      message_type: 'text',
    });

    if (!error) {
      setNewMessage('');
      fetchMessages(selectedUser);
    }
    setLoading(false);
  };

  return (
    <div className="private-messages">
      <div className="conversations-list">
        <div className="list-header">
          <MessageCircle size={24} />
          <h3>المحادثات الخاصة</h3>
        </div>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${selectedUser === conv.id ? 'active' : ''}`}
            onClick={() => setSelectedUser(conv.id)}
          >
            <div className="conversation-avatar">
              {conv.avatar_url ? (
                <img src={conv.avatar_url} alt={conv.display_name} />
              ) : (
                <div className="avatar-placeholder">{conv.display_name.charAt(0)}</div>
              )}
            </div>
            <div className="conversation-info">
              <div className="conversation-name">{conv.display_name}</div>
              <div className="conversation-last">@{conv.username}</div>
            </div>
            {conv.unread_count > 0 && (
              <span className="unread-badge">{conv.unread_count}</span>
            )}
          </div>
        ))}
      </div>

      <div className="messages-area">
        {selectedUser ? (
          <>
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`private-message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    {msg.message_type === 'text' && <p>{msg.message_text}</p>}
                    {msg.message_type === 'voice' && (
                      <div className="voice-message">
                        <Mic size={16} />
                        <span>رسالة صوتية</span>
                      </div>
                    )}
                    {msg.media_url && (
                      <img src={msg.media_url} alt="مرفق" className="message-media" />
                    )}
                  </div>
                  <span className="message-timestamp">
                    {new Date(msg.created_at).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="message-input">
              <button type="button" className="btn-icon" title="رسالة صوتية">
                <Mic size={20} />
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
          </>
        ) : (
          <div className="no-conversation">
            <MessageCircle size={64} />
            <p>اختر محادثة لبدء المراسلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
