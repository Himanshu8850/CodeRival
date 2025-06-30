from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from bson import ObjectId
import json

users_bp = Blueprint('users', __name__)

def init_users_routes(mongo):
    user_model = User(mongo.db)
    
    @users_bp.route('/search', methods=['GET'])
    @jwt_required()
    def search_users():
        try:
            query = request.args.get('q', '')
            if not query:
                return jsonify({'users': []}), 200
            
            users = user_model.search_users(query)
            
            # Remove sensitive information and convert ObjectId to string
            for user in users:
                user.pop('password_hash', None)
                user['_id'] = str(user['_id'])
                user['friends'] = [str(friend_id) for friend_id in user.get('friends', [])]
                user['friend_requests_sent'] = [str(req_id) for req_id in user.get('friend_requests_sent', [])]
                user['friend_requests_received'] = [str(req_id) for req_id in user.get('friend_requests_received', [])]
            
            return jsonify({'users': users}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/profile/<username>', methods=['GET'])
    @jwt_required()
    def get_user_profile(username):
        try:
            user = user_model.get_user_by_username(username)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Remove sensitive information
            user.pop('password_hash', None)
            user['_id'] = str(user['_id'])
            user['friends'] = [str(friend_id) for friend_id in user.get('friends', [])]
            user['friend_requests_sent'] = [str(req_id) for req_id in user.get('friend_requests_sent', [])]
            user['friend_requests_received'] = [str(req_id) for req_id in user.get('friend_requests_received', [])]
            
            return jsonify({'user': user}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/profile', methods=['PUT'])
    @jwt_required()
    def update_profile():
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            
            # Only allow certain fields to be updated
            allowed_fields = ['bio', 'profile_picture']
            update_data = {key: value for key, value in data.items() if key in allowed_fields}
            
            if not update_data:
                return jsonify({'error': 'No valid fields to update'}), 400
            
            result = user_model.update_profile(current_user_id, update_data)
            
            if result.modified_count == 0:
                return jsonify({'error': 'Profile not updated'}), 400
            
            return jsonify({'message': 'Profile updated successfully'}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/friend-request', methods=['POST'])
    @jwt_required()
    def send_friend_request():
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            
            print(f"DEBUG: Friend request data: {data}")
            print(f"DEBUG: Current user ID: {current_user_id}")
            
            receiver_username = data.get('username')
            
            if not receiver_username:
                print("DEBUG: No username provided")
                return jsonify({'error': 'Username is required'}), 400

            receiver = user_model.get_user_by_username(receiver_username)
            if not receiver:
                print(f"DEBUG: User {receiver_username} not found")
                return jsonify({'error': 'User not found'}), 404

            receiver_id = str(receiver['_id'])
            print(f"DEBUG: Receiver ID: {receiver_id}")
            
            # Check if trying to send request to self
            if current_user_id == receiver_id:
                print("DEBUG: Trying to send friend request to self")
                return jsonify({'error': 'Cannot send friend request to yourself'}), 400

            # Check if they're already friends
            if ObjectId(current_user_id) in receiver.get('friends', []):
                print("DEBUG: Already friends")
                return jsonify({'error': 'Already friends'}), 400

            # Check if request already sent
            if ObjectId(current_user_id) in receiver.get('friend_requests_received', []):
                print("DEBUG: Friend request already sent")
                return jsonify({'error': 'Friend request already sent'}), 400

            result = user_model.send_friend_request(current_user_id, receiver_id)
            print(f"DEBUG: Send friend request result: {result.modified_count}")

            if result.modified_count == 0:
                print("DEBUG: Failed to send friend request - no documents modified")
                return jsonify({'error': 'Failed to send friend request'}), 400

            return jsonify({'message': 'Friend request sent successfully'}), 200

        except Exception as e:
            print(f"DEBUG: Exception in send_friend_request: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/friend-request/<action>', methods=['POST'])
    @jwt_required()
    def handle_friend_request(action):
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            friend_id = data.get('friend_id')
            
            print(f"DEBUG: {action} friend request - user: {current_user_id}, friend: {friend_id}")
            
            if not friend_id:
                print("DEBUG: No friend_id provided")
                return jsonify({'error': 'Friend ID is required'}), 400
            
            if action == 'accept':
                result = user_model.accept_friend_request(current_user_id, friend_id)
                message = 'Friend request accepted'
                print(f"DEBUG: Accept result: {result.modified_count}")
            elif action == 'reject':
                result = user_model.reject_friend_request(current_user_id, friend_id)
                message = 'Friend request rejected'
                print(f"DEBUG: Reject result: {result.modified_count}")
            else:
                print(f"DEBUG: Invalid action: {action}")
                return jsonify({'error': 'Invalid action'}), 400
            
            if result.modified_count == 0:
                print(f"DEBUG: Failed to {action} friend request - no documents modified")
                return jsonify({'error': f'Failed to {action} friend request'}), 400
            
            return jsonify({'message': message}), 200
            
        except Exception as e:
            print(f"DEBUG: Exception in handle_friend_request: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/friends', methods=['GET'])
    @jwt_required()
    def get_friends():
        try:
            current_user_id = get_jwt_identity()
            print(f"DEBUG: Getting friends for user: {current_user_id}")
            
            friends = user_model.get_friends(current_user_id)
            print(f"DEBUG: Found {len(friends)} friends")
            
            # Convert ObjectId to string
            for friend in friends:
                print(f"DEBUG: Processing friend: {friend.get('_id')}")
                friend['_id'] = str(friend['_id'])
                friend['friends'] = [str(friend_id) for friend_id in friend.get('friends', [])]
                friend['friend_requests_sent'] = [str(req_id) for req_id in friend.get('friend_requests_sent', [])]
                friend['friend_requests_received'] = [str(req_id) for req_id in friend.get('friend_requests_received', [])]
            
            print(f"DEBUG: Successfully processed all friends")
            return jsonify({'friends': friends}), 200
            
        except Exception as e:
            print(f"DEBUG: Exception in get_friends: {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            return jsonify({'error': str(e)}), 500
    
    @users_bp.route('/friend-requests', methods=['GET'])
    @jwt_required()
    def get_friend_requests():
        try:
            current_user_id = get_jwt_identity()
            print(f"DEBUG: Getting friend requests for user: {current_user_id}")
            
            requests = user_model.get_friend_requests(current_user_id)
            print(f"DEBUG: Found {len(requests)} friend requests")
            
            # Convert ObjectId to string
            for req in requests:
                req['_id'] = str(req['_id'])
                req['friends'] = [str(friend_id) for friend_id in req.get('friends', [])]
                req['friend_requests_sent'] = [str(req_id) for req_id in req.get('friend_requests_sent', [])]
                req['friend_requests_received'] = [str(req_id) for req_id in req.get('friend_requests_received', [])]
            
            return jsonify({'friend_requests': requests}), 200
            
        except Exception as e:
            print(f"DEBUG: Exception in get_friend_requests: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    return users_bp
