import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Users,
  Clock,
} from "lucide-react";
import { postsAPI, usersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PostForm from "../components/PostForm";
import type { Post, User } from "../services/api";

const Home: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<User[]>([]);

  useEffect(() => {
    loadFeed();
    loadFriends();
    loadFriendRequests();
  }, [posts]);

  const loadFeed = async () => {
    try {
      const response = await postsAPI.getFeed();
      setPosts(response.posts);
    } catch (error) {
      console.error("Failed to load feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await usersAPI.getFriends();
      setFriends(response.friends);
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await usersAPI.getFriendRequests();
      setFriendRequests(response.friend_requests);
    } catch (error) {
      console.error("Failed to load friend requests:", error);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await postsAPI.unlikePost(postId);
      } else {
        await postsAPI.likePost(postId);
      }

      // Update the post in the local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const updatedLikes = isLiked
              ? post.likes.filter((like) => like !== user?._id)
              : [...post.likes, user?._id || ""];
            return { ...post, likes: updatedLikes };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handleAcceptFriendRequest = async (friendId: string) => {
    try {
      await usersAPI.acceptFriendRequest(friendId);
      // Refresh both friends and friend requests
      loadFriends();
      loadFriendRequests();
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const handleRejectFriendRequest = async (friendId: string) => {
    try {
      await usersAPI.rejectFriendRequest(friendId);
      // Refresh friend requests
      loadFriendRequests();
    } catch (error) {
      console.error("Failed to reject friend request:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading your feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Beijjati Count</span>
                  <span className="font-semibold text-red-600">
                    {user?.beijjati_count || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Friends</span>
                  <span className="font-semibold text-blue-600">
                    {friends.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Friend Requests
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {friendRequests.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {request.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.beijjati_count} beijjatis
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(request._id)}
                          className="btn btn-primary text-xs px-3 py-1"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectFriendRequest(request._id)}
                          className="btn btn-secondary text-xs px-3 py-1"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Friends
              </h3>
              <div className="space-y-3">
                {friends.slice(0, 5).map((friend) => (
                  <div key={friend._id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {friend.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {friend.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {friend.beijjati_count} beijjatis
                      </p>
                    </div>
                  </div>
                ))}
                {friends.length > 5 && (
                  <p className="text-sm text-gray-500">
                    +{friends.length - 5} more friends
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Post Form */}
            <PostForm onPostCreated={handlePostCreated} />

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => {
                const isLiked = post.likes.includes(user?._id || "");

                return (
                  <div
                    key={post._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200"
                  >
                    {/* Post Header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="font-medium text-gray-700">
                              {post.author.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {post.author.username}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTime(post.created_at)}
                            </p>
                          </div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-6 py-4">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Beijjati Badge */}
                      {post.is_beizzati && (
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          🔥 Beizzati Alert!
                        </div>
                      )}

                      {/* Mentioned Users */}
                      {post.mentioned_users_details &&
                        post.mentioned_users_details.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {post.mentioned_users_details.map(
                              (mentionedUser) => (
                                <span
                                  key={mentionedUser._id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                                >
                                  @{mentionedUser.username}
                                </span>
                              )
                            )}
                          </div>
                        )}
                    </div>

                    {/* Post Actions */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLike(post._id, isLiked)}
                            className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                              isLiked
                                ? "text-red-600 hover:text-red-700"
                                : "text-gray-500 hover:text-red-600"
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                isLiked ? "fill-current" : ""
                              }`}
                            />
                            <span>{post.likes.length}</span>
                          </button>

                          <button className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span>Comment</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {posts.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <p className="text-gray-500 mb-4">No posts to show yet.</p>
                  <p className="text-sm text-gray-400">
                    Add some friends and start posting to see content in your
                    feed!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
