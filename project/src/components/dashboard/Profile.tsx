import { useEffect, useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { supabase, Profile as ProfileType, Post } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from './PostCard';

interface ProfileProps {
  userId: string | null;
}

const Profile = ({ userId }: ProfileProps) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const profileUserId = userId || currentUser?.id;

  useEffect(() => {
    if (profileUserId) {
      loadProfile();
      loadPosts();
      loadStats();
      checkFollowStatus();
    }
  }, [profileUserId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileUserId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url),
          likes (id, user_id),
          comments (id)
        `)
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithCounts = data?.map(post => ({
        ...post,
        like_count: post.likes?.length || 0,
        comment_count: post.comments?.length || 0,
        is_liked: post.likes?.some(like => like.user_id === currentUser?.id) || false,
      })) || [];

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [followersRes, followingRes, postsRes] = await Promise.all([
        supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', profileUserId),
        supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', profileUserId),
        supabase.from('posts').select('id', { count: 'exact' }).eq('user_id', profileUserId),
      ]);

      setStats({
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        posts: postsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || currentUser.id === profileUserId) return;

    try {
      const { data } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileUserId)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || currentUser.id === profileUserId) return;

    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileUserId);
      } else {
        await supabase.from('followers').insert([
          {
            follower_id: currentUser.id,
            following_id: profileUserId,
          },
        ]);

        await supabase.from('notifications').insert([
          {
            user_id: profileUserId,
            type: 'follow',
            content: `started following you`,
            related_user_id: currentUser.id,
          },
        ]);
      }

      setIsFollowing(!isFollowing);
      loadStats();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">Profile not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUserId;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-600" />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center border-4 border-slate-800">
              <span className="text-white text-4xl font-bold">
                {profile.username?.charAt(0).toUpperCase()}
              </span>
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isFollowing
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/50'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-100 mb-1">{profile.full_name}</h2>
            <p className="text-slate-400">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-slate-300 mb-4">{profile.bio}</p>
          )}

          <div className="flex gap-6">
            <div>
              <span className="text-slate-100 font-bold">{stats.posts}</span>
              <span className="text-slate-400 ml-1">Posts</span>
            </div>
            <div>
              <span className="text-slate-100 font-bold">{stats.followers}</span>
              <span className="text-slate-400 ml-1">Followers</span>
            </div>
            <div>
              <span className="text-slate-100 font-bold">{stats.following}</span>
              <span className="text-slate-400 ml-1">Following</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-100">Posts</h3>
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-400">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={loadPosts} onProfileClick={() => {}} />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
