from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from bson import ObjectId
import json

auth_bp = Blueprint('auth', __name__)

def init_auth_routes(mongo):
    user_model = User(mongo.db)
    
    @auth_bp.route('/register', methods=['POST'])
    def register():
        try:
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if not username or not email or not password:
                return jsonify({'error': 'Username, email, and password are required'}), 400
            
            user_id = user_model.create_user(username, email, password)
            
            if not user_id:
                return jsonify({'error': 'Username or email already exists'}), 400
            
            access_token = create_access_token(identity=user_id)
            
            return jsonify({
                'message': 'User created successfully',
                'access_token': access_token,
                'user_id': user_id
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @auth_bp.route('/login', methods=['POST'])
    def login():
        try:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return jsonify({'error': 'Username and password are required'}), 400
            
            user = user_model.authenticate_user(username, password)
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            access_token = create_access_token(identity=str(user['_id']))
            
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user_id': str(user['_id']),
                'username': user['username']
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @auth_bp.route('/me', methods=['GET'])
    @jwt_required()
    def get_current_user():
        try:
            current_user_id = get_jwt_identity()
            user = user_model.get_user_by_id(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Remove sensitive information and convert ObjectId to string
            user.pop('password_hash', None)
            user['_id'] = str(user['_id'])
            user['friends'] = [str(friend_id) for friend_id in user.get('friends', [])]
            user['friend_requests_sent'] = [str(req_id) for req_id in user.get('friend_requests_sent', [])]
            user['friend_requests_received'] = [str(req_id) for req_id in user.get('friend_requests_received', [])]
            
            return jsonify({'user': user}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return auth_bp
