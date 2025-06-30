import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Edit3, UserPlus, UserCheck, MessageCircle, Heart, Calendar } from 'lucide-react';
import { usersAPI, postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { User, Post } from '../services/api';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [mentions, setMentions] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'mentions'>('posts');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', profile_picture: '' });

  const isOwnProfile = currentUser?.username === username;
  const isFriend = profileUser?.friends.includes(currentUser?._id || '');
  const hasPendingRequest = profileUser?.friend_requests_received.includes(currentUser?._id || '');

  const loadProfile = useCallback(async () => {
    if (!username) return;

    try {
      const [userResponse, postsResponse, mentionsResponse] = await Promise.all([
        usersAPI.getUserProfile(username),
        postsAPI.getUserPosts(username),
        postsAPI.getUserMentions(username)
      ]);

      setProfileUser(userResponse.user);
      setPosts(postsResponse.posts);
      setMentions(mentionsResponse.posts);
      setEditForm({
        bio: userResponse.user.bio || '',
        profile_picture: userResponse.user.profile_picture || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username, loadProfile]);

  const handleSendFriendRequest = async () => {
    if (!username) return;

    try {
      await usersAPI.sendFriendRequest(username);
      // Refresh profile to update friend request status
      loadProfile();
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleEditProfile = async () => {
    try {
      await usersAPI.updateProfile(editForm);
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">
                  {profileUser.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileUser.username}</h1>
                <p className="text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Joined {formatDate(profileUser.created_at)}
                </p>
                {profileUser.bio && (
                  <p className="text-gray-700 mt-2">{profileUser.bio}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  {isFriend ? (
                    <div className="inline-flex items-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Friends
                    </div>
                  ) : hasPendingRequest ? (
                    <div className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-700 bg-yellow-50">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Request Sent
                    </div>
                  ) : (
                    <button
                      onClick={handleSendFriendRequest}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{profileUser.beijjati_count}</div>
              <div className="text-sm text-gray-500">Beijjati Count</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
              <div className="text-sm text-gray-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{profileUser.friends.length}</div>
              <div className="text-sm text-gray-500">Friends</div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={editForm.profile_picture}
                    onChange={(e) => setEditForm({ ...editForm, profile_picture: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-3 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Posts ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('mentions')}
                className={`py-3 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'mentions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mentions ({mentions.length})
              </button>
            </nav>
          </div>

          {/* Posts Content */}
          <div className="p-6">
            {activeTab === 'posts' ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="font-medium text-gray-700">
                          {post.author.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{post.author.username}</span>
                          <span className="text-gray-500 text-sm">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          {post.is_beizzati && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🔥 Beijjati
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {post.likes.length}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.comments.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No posts yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {mentions.map((post) => (
                  <div key={post._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="font-medium text-gray-700">
                          {post.author.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{post.author.username}</span>
                          <span className="text-gray-500 text-sm">mentioned you</span>
                          <span className="text-gray-500 text-sm">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          {post.is_beizzati && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🔥 Beijjati
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {post.likes.length}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.comments.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {mentions.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No mentions yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
