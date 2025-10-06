import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { supabase, Comment } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CommentSectionProps {
  postId: string;
  onUpdate: () => void;
  onProfileClick: (userId: string) => void;
}

const CommentSection = ({ postId, onUpdate, onProfileClick }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);

    try {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      await supabase.from('comments').insert([
        {
          user_id: user.id,
          post_id: postId,
          content: newComment.trim(),
        },
      ]);

      if (post && post.user_id !== user.id) {
        await supabase.from('notifications').insert([
          {
            user_id: post.user_id,
            type: 'comment',
            content: `commented on your post`,
            related_user_id: user.id,
            related_post_id: postId,
          },
        ]);
      }

      setNewComment('');
      loadComments();
      onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await supabase.from('comments').delete().match({ id: commentId });
      loadComments();
      onUpdate();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="border-t border-slate-700 p-6 bg-slate-900/30">
      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <button
              onClick={() => onProfileClick(comment.user_id)}
              className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <span className="text-white text-xs font-bold">
                {comment.profiles?.username?.charAt(0).toUpperCase()}
              </span>
            </button>

            <div className="flex-1">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <button
                    onClick={() => onProfileClick(comment.user_id)}
                    className="font-medium text-slate-200 hover:text-cyan-400 transition-colors"
                  >
                    {comment.profiles?.full_name}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">{formatDate(comment.created_at)}</span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-300 text-sm">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || loading}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
