import { useEffect, useState } from 'react';
import { Search, TrendingUp, Loader2 } from 'lucide-react';
import { supabase, Post, Profile as ProfileType } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from './PostCard';

interface ExploreProps {
  onProfileClick: (userId: string) => void;
}

const Explore = ({ onProfileClick }: ExploreProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingPosts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadTrendingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          likes (id, user_id),
          comments (id)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const postsWithCounts = data?.map(post => ({
        ...post,
        like_count: post.likes?.length || 0,
        comment_count: post.comments?.length || 0,
        is_liked: post.likes?.some(like => like.user_id === user?.id) || false,
      })) || [];

      const sorted = postsWithCounts.sort((a, b) =>
        (b.like_count + b.comment_count) - (a.like_count + a.comment_count)
      );

      setTrendingPosts(sorted.slice(0, 10));
    } catch (error) {
      console.error('Error loading trending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
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
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((profile) => (
              <button
                key={profile.id}
                onClick={() => onProfileClick(profile.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {profile.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-slate-100 font-medium">{profile.full_name}</p>
                  <p className="text-slate-400 text-sm">@{profile.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-slate-100">Trending Posts</h2>
        </div>

        <div className="space-y-6">
          {trendingPosts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={loadTrendingPosts} onProfileClick={onProfileClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
