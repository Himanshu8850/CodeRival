"# Beijjati Tracker

A social media application where users can track and share "beijjati" moments with friends. Built with Flask (backend), React with TypeScript (frontend), and MongoDB (database).

## Features

- **User Authentication**: Register and login with secure JWT tokens
- **Friend System**: Send, accept, and reject friend requests
- **Post Creation**: Create posts with optional beijjati tagging
- **User Mentions**: Mention users in posts and increment their beijjati count
- **Profile Management**: View and edit user profiles
- **Social Feed**: See posts from friends and own posts
- **Search**: Search for users by username
- **Beijjati Tracking**: Track beijjati count for each user

## Tech Stack

### Backend
- **Flask**: Python web framework
- **MongoDB**: Document database
- **Flask-PyMongo**: MongoDB integration
- **Flask-JWT-Extended**: JWT authentication
- **Flask-CORS**: Cross-origin resource sharing
- **bcrypt**: Password hashing

### Frontend
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Lucide React**: Icons

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Update the `.env` file with your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/beijjati_tracker
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
   FLASK_ENV=development
   ```

5. Run the Flask application:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas (cloud)
2. Create a database named `beijjati_tracker`
3. The application will automatically create the required collections

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users/search?q={query}` - Search users
- `GET /api/users/profile/{username}` - Get user profile
- `PUT /api/users/profile` - Update own profile
- `POST /api/users/friend-request` - Send friend request
- `POST /api/users/friend-request/accept` - Accept friend request
- `POST /api/users/friend-request/reject` - Reject friend request
- `GET /api/users/friends` - Get friends list
- `GET /api/users/friend-requests` - Get friend requests

### Posts
- `POST /api/posts/` - Create a new post
- `GET /api/posts/feed` - Get user's feed
- `GET /api/posts/user/{username}` - Get user's posts
- `GET /api/posts/mentions/{username}` - Get user's mentions
- `POST /api/posts/{post_id}/like` - Like a post
- `POST /api/posts/{post_id}/unlike` - Unlike a post

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Search Users**: Use the search bar to find other users
3. **Send Friend Requests**: Add friends to see their posts in your feed
4. **Create Posts**: Share updates and tag friends
5. **Mark Beijjati**: Use the beijjati checkbox when creating posts to increment mentioned users' beijjati count
6. **View Profiles**: Click on usernames to view their profiles, posts, and mentions
7. **Edit Profile**: Update your bio and profile information

## Project Structure

```
beijjati-tracker/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   ├── models/
│   │   ├── user.py           # User model and operations
│   │   └── post.py           # Post model and operations
│   └── routes/
│       ├── auth.py           # Authentication routes
│       ├── users.py          # User-related routes
│       └── posts.py          # Post-related routes
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service functions
│   │   └── App.tsx          # Main App component
│   ├── package.json         # Node.js dependencies
│   └── tailwind.config.js   # Tailwind CSS configuration
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE)." 
