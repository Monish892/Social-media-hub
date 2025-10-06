import { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Loader2 } from 'lucide-react';
import { supabase, Notification } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationsProps {
  onProfileClick: (userId: string) => void;
}

const Notifications = ({ onProfileClick }: NotificationsProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();

      const channel = supabase
        .channel('notifications_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
          loadNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!notifications_related_user_id_fkey (id, username, full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-400" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-cyan-400" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Notifications</h2>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border transition-all duration-300 hover:border-cyan-400/50 ${
                notification.is_read ? 'border-slate-700' : 'border-cyan-400/30 bg-cyan-400/5'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {notification.related_user_id && (
                        <button
                          onClick={() => onProfileClick(notification.related_user_id!)}
                          className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          @{notification.profiles?.username}
                        </button>
                      )}
                      <span className="text-slate-300 ml-1">{notification.content}</span>
                    </div>
                    <span className="text-slate-400 text-sm whitespace-nowrap">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
