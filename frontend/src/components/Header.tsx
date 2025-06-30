import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import type { User as UserType } from '../services/api';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      try {
        const response = await usersAPI.searchUsers(query);
        setSearchResults(response.users);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="avatar avatar-md">
              <span>B</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">Beijjati Tracker</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                {searchResults.map((searchUser) => (
                  <div
                    key={searchUser._id}
                    onClick={() => handleUserClick(searchUser.username)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="avatar avatar-sm">
                        <span>{searchUser.username[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{searchUser.username}</p>
                        <p className="text-sm text-gray-500">Beijjati Count: {searchUser.beijjati_count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Link
              to="/notifications"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6" />
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="avatar avatar-sm">
                  <span>{user?.username?.[0]?.toUpperCase()}</span>
                </div>
                <span className="font-medium hidden sm:block">{user?.username}</span>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <Link
                      to={`/profile/${user?.username}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-3" />
                      View Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
