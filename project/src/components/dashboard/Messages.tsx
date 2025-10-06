import { useEffect, useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { supabase, Message, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUser && user) {
      loadMessages(selectedUser.id);

      const channel = supabase
        .channel(`messages_${selectedUser.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedUser.id},receiver_id=eq.${user.id}`
        }, () => {
          loadMessages(selectedUser.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (id, username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey (id, username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userMap = new Map();
      messagesData?.forEach((msg) => {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (!userMap.has(otherUser.id)) {
          userMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: msg,
          });
        }
      });

      setConversations(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (id, username, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey (id, username, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedUser.id);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] pb-20 lg:pb-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden h-full flex">
        <div className="w-full lg:w-80 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-slate-100">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user.id}
                  onClick={() => setSelectedUser(conv.user)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700 ${
                    selectedUser?.id === conv.user.id ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {conv.user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-slate-100 font-medium truncate">{conv.user.full_name}</p>
                    <p className="text-slate-400 text-sm truncate">{conv.lastMessage.content}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedUser ? (
          <div className="hidden lg:flex flex-1 flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {selectedUser.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-slate-100 font-medium">{selectedUser.full_name}</p>
                <p className="text-slate-400 text-sm">@{selectedUser.username}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isSent = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isSent ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isSent
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : 'bg-slate-700 text-slate-100'
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                      <p className={`text-xs text-slate-400 mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
