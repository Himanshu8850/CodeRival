from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.post import Post
from models.user import User
from bson import ObjectId
import json
import pytesseract
posts_bp = Blueprint('posts', __name__)

def convert_objectids_to_strings(obj):
    """Recursively convert all ObjectId instances to strings in a data structure"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: convert_objectids_to_strings(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids_to_strings(item) for item in obj]
    else:
        return obj

def init_posts_routes(mongo):
    post_model = Post(mongo.db)
    user_model = User(mongo.db)
    
    @posts_bp.route('', methods=['POST'])
    @posts_bp.route('/', methods=['POST'])
    @jwt_required()
    def create_post():
        try:
            current_user_id = get_jwt_identity()

            content = request.form.get('content')
            is_beizzati = request.form.get('is_beizzati') == 'true'
            mentioned_usernames = json.loads(request.form.get('mentioned_users', '[]'))
            image_file = request.files.get('image')

            if not content:
                return jsonify({'error': 'Content is required'}), 400

            if is_beizzati:
                if not image_file:
                    return jsonify({'error': 'Image is required for Beijjati post'}), 400
                if not verify_image_contains_beijjati_evidence(image_file):
                    return jsonify({'error': 'Image does not qualify as Beijjati'}), 400

            # Get mentioned user IDs
            mentioned_user_ids = []
            for username in mentioned_usernames:
                user = user_model.get_user_by_username(username)
                if user:
                    mentioned_user_ids.append(str(user['_id']))
                    if is_beizzati:
                        user_model.increment_beijjati_count(user['_id'])

            post_id = post_model.create_post(
                current_user_id,
                content,
                is_beizzati,
                mentioned_user_ids
            )

            if not post_id:
                return jsonify({'error': 'Failed to create post'}), 400

            return jsonify({
                'message': 'Post created successfully',
                'post_id': post_id
            }), 201

        except Exception as e:
            return jsonify({'error': str(e)}), 500


    def verify_image_contains_beijjati_evidence(image_file):
    # Dummy logic for now, replace with Gemini/Vision API/OCR later
        import pytesseract
        from PIL import Image
        try:
            img = Image.open(image_file)
            text = pytesseract.image_to_string(img).lower()

            if "solved" in text and any(q in text for q in ["q1", "q2", "q3", "q4"]):
                return True
            return False
        except Exception as e:
            print(f"Image processing error: {e}")
            return False
    
    @posts_bp.route('/feed', methods=['GET'])
    @jwt_required()
    def get_feed():
        try:
            current_user_id = get_jwt_identity()
            print(f"DEBUG: Getting feed for user: {current_user_id}")
            
            posts = post_model.get_posts_for_user(current_user_id)
            print(f"DEBUG: Found {len(posts)} posts")

            # Convert all ObjectId fields to strings recursively
            posts = convert_objectids_to_strings(posts)

            print(f"DEBUG: Successfully processed all posts")
            return jsonify({'posts': posts}), 200

        except Exception as e:
            print(f"DEBUG: Exception in get_feed: {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/user/<username>', methods=['GET'])
    @jwt_required()
    def get_user_posts(username):
        try:
            user = user_model.get_user_by_username(username)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            posts = post_model.get_posts_by_user(str(user['_id']))
            
            # Convert all ObjectId fields to strings recursively
            posts = convert_objectids_to_strings(posts)
            
            return jsonify({'posts': posts}), 200
            
        except Exception as e:
            print(f"DEBUG: Exception in get_user_posts: {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/mentions/<username>', methods=['GET'])
    @jwt_required()
    def get_user_mentions(username):
        try:
            user = user_model.get_user_by_username(username)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            posts = post_model.get_mentions_for_user(str(user['_id']))
            
            # Convert all ObjectId fields to strings recursively
            posts = convert_objectids_to_strings(posts)
            
            return jsonify({'posts': posts}), 200
            
        except Exception as e:
            print(f"DEBUG: Exception in get_user_mentions: {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/<post_id>/like', methods=['POST'])
    @jwt_required()
    def like_post(post_id):
        try:
            current_user_id = get_jwt_identity()
            result = post_model.like_post(post_id, current_user_id)
            
            if result.modified_count == 0:
                return jsonify({'error': 'Failed to like post'}), 400
            
            return jsonify({'message': 'Post liked successfully'}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @posts_bp.route('/<post_id>/unlike', methods=['POST'])
    @jwt_required()
    def unlike_post(post_id):
        try:
            current_user_id = get_jwt_identity()
            result = post_model.unlike_post(post_id, current_user_id)
            
            if result.modified_count == 0:
                return jsonify({'error': 'Failed to unlike post'}), 400
            
            return jsonify({'message': 'Post unliked successfully'}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return posts_bp
