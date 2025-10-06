import { useState } from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { supabase, Post } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
  onProfileClick: (userId: string) => void;
}

const PostCard = ({ post, onUpdate, onProfileClick }: PostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);

    try {
      if (post.is_liked) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
      } else {
        await supabase.from('likes').insert([{ user_id: user.id, post_id: post.id }]);

        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert([
            {
              user_id: post.user_id,
              type: 'like',
              content: `${post.profiles?.username} liked your post`,
              related_user_id: user.id,
              related_post_id: post.id,
            },
          ]);
        }
      }

      onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) return;

    try {
      await supabase.from('posts').delete().match({ id: post.id });
      onUpdate();
    } catch (error) {
      console.error('Error deleting post:', error);
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

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={() => onProfileClick(post.user_id)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {post.profiles?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-slate-100 font-medium">{post.profiles?.full_name}</p>
              <p className="text-slate-400 text-sm">@{post.profiles?.username}</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{formatDate(post.created_at)}</span>
            {user?.id === post.user_id && (
              <button
                onClick={handleDelete}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-200 mb-4 whitespace-pre-wrap">{post.content}</p>

        {post.media_url && (
          <img
            src={post.media_url}
            alt="Post media"
            className="w-full rounded-lg mb-4"
          />
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-slate-700">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 transition-colors ${
              post.is_liked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.like_count}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comment_count}</span>
          </button>
        </div>
      </div>

      {showComments && <CommentSection postId={post.id} onUpdate={onUpdate} onProfileClick={onProfileClick} />}
    </div>
  );
};

export default PostCard;
