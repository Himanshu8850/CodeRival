from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from routes.auth import auth_bp, init_auth_routes
from routes.users import users_bp, init_users_routes
from routes.posts import posts_bp, init_posts_routes
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    # socketio = SocketIO(app, cors_allowed_origins="*")  # or frontend origin
    
    # Configuration
    app.config['MONGO_URI'] = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/beizzati_tracker')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key')
    # Initialize extensions
    CORS(app, supports_credentials=True)
    mongo = PyMongo(app)
    jwt = JWTManager(app)
    
    # Initialize routes
    auth_bp_initialized = init_auth_routes(mongo)
    users_bp_initialized = init_users_routes(mongo)
    posts_bp_initialized = init_posts_routes(mongo)
    
    # Register blueprints
    app.register_blueprint(auth_bp_initialized, url_prefix='/api/auth')
    app.register_blueprint(users_bp_initialized, url_prefix='/api/users')
    app.register_blueprint(posts_bp_initialized, url_prefix='/api/posts')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'Beijjati Tracker API is running'}), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)