import React, { useState } from "react";
import { Send, Users } from "lucide-react";
import { postsAPI, usersAPI } from "../services/api";
import type { Post, User } from "../services/api";

interface PostFormProps {
  onPostCreated: (post: Post) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [isBeizzati, setisBeizzati] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const handleMentionSearch = async (query: string) => {
    setMentionQuery(query);
    if (query.trim().length > 1) {
      try {
        const response = await usersAPI.searchUsers(query);
        setSearchResults(
          response.users.filter(
            (user) =>
              !mentionedUsers.find((mentioned) => mentioned._id === user._id)
          )
        );
        setShowMentionSearch(true);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowMentionSearch(false);
    }
  };

  const addMentionedUser = (user: User) => {
    setMentionedUsers([...mentionedUsers, user]);
    setMentionQuery("");
    setShowMentionSearch(false);
    setSearchResults([]);
  };

  const removeMentionedUser = (userId: string) => {
    setMentionedUsers(mentionedUsers.filter((user) => user._id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    try {
      const mentionedUsernames = mentionedUsers.map((user) => user.username);

      const formData = new FormData();
      formData.append("content", content);
      formData.append("is_beizzati", isBeizzati.toString());
      formData.append("mentioned_users", JSON.stringify(mentionedUsernames));
      if (image) formData.append("image", image);

      const response = await postsAPI.createPostWithImage(formData);
      const newPost: Post = {
        _id: response.post_id,
        author_id: "current-user-id",
        author: {
          _id: "current-user-id",
          username: "You",
          email: "",
          beijjati_count: 0,
          friends: [],
          friend_requests_sent: [],
          friend_requests_received: [],
          created_at: new Date().toISOString(),
        },
        content,
        is_beizzati: isBeizzati,
        mentioned_users: mentionedUsers.map((user) => user._id),
        mentioned_users_details: mentionedUsers,
        visible_to: [],
        likes: [],
        comments: [],
        created_at: new Date().toISOString(),
      };

      onPostCreated(newPost);
      setContent("");
      setisBeizzati(false);
      setMentionedUsers([]);
      setMentionQuery("");
      setImage(null);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening? Share a story, call out some beijjati..."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        {/* Mention Users */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Mention users:
            </span>
          </div>

          {/* Selected mentioned users */}
          {mentionedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {mentionedUsers.map((user) => (
                <span
                  key={user._id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                >
                  @{user.username}
                  <button
                    type="button"
                    onClick={() => removeMentionedUser(user._id)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search for users to mention */}
          <div className="relative">
            <input
              type="text"
              value={mentionQuery}
              onChange={(e) => handleMentionSearch(e.target.value)}
              placeholder="Search users to mention..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Mention search results */}
            {showMentionSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => addMentionedUser(user)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {user.username}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Beijjati checkbox */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isBeizzati}
              onChange={(e) => setisBeizzati(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              🔥 This is a Beijjati post (will increment mentioned users'
              beijjati count)
            </span>
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Attach Image:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </div>
        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Posting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
