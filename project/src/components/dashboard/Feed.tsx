import { useEffect, useState } from 'react';
import { supabase, Post } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { Loader2 } from 'lucide-react';

interface FeedProps {
  onProfileClick: (userId: string) => void;
}

const Feed = ({ onProfileClick }: FeedProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();

    const channel = supabase
      .channel('posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          likes (id, user_id),
          comments (id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithCounts = postsData?.map(post => ({
        ...post,
        like_count: post.likes?.length || 0,
        comment_count: post.comments?.length || 0,
        is_liked: post.likes?.some(like => like.user_id === user?.id) || false,
      })) || [];

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <CreatePost onPostCreated={handlePostCreated} />

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={loadPosts} onProfileClick={onProfileClick} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
