import { useState } from 'react';
import { Image, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreatePostProps {
  onPostCreated: () => void;
}

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: content.trim(),
          media_url: '',
          media_type: '',
        },
      ]);

      if (error) throw error;

      setContent('');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">
            {profile?.username?.charAt(0).toUpperCase()}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
          />

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Image className="w-5 h-5" />
              <span className="text-sm">Photo</span>
            </button>

            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
