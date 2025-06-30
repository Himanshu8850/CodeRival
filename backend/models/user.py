from bson import ObjectId
from datetime import datetime
import bcrypt

class User:
    def __init__(self, db):
        self.collection = db.users
    
    def create_user(self, username, email, password):
        # Check if user already exists
        if self.collection.find_one({"$or": [{"username": username}, {"email": email}]}):
            return None
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_data = {
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "profile_picture": "",
            "bio": "",
            "beijjati_count": 0,
            "friends": [],
            "friend_requests_sent": [],
            "friend_requests_received": [],
            "created_at": datetime.utcnow()
        }
        
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)
    
    def authenticate_user(self, username, password):
        try:
            user = self.collection.find_one({"username": username})
            if user and user.get('password_hash') and bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
                return user
            return None
        except Exception as e:
            print(f"Error in authenticate_user: {e}")
            return None
    
    def get_user_by_id(self, user_id):
        try:
            return self.collection.find_one({"_id": ObjectId(user_id)})
        except:
            return None
    
    def get_user_by_username(self, username):
        return self.collection.find_one({"username": username})
    
    def search_users(self, query):
        return list(self.collection.find({
            "username": {"$regex": query, "$options": "i"}
        }).limit(20))
    
    def update_profile(self, user_id, profile_data):
        try:
            return self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": profile_data}
            )
        except Exception as e:
            print(f"Error in update_profile: {e}")
            class MockResult:
                modified_count = 0
            return MockResult()
    
    def send_friend_request(self, sender_id, receiver_id):
        try:
            sender_object_id = ObjectId(sender_id)
            receiver_object_id = ObjectId(receiver_id)
            
            # Add to sender's sent requests
            self.collection.update_one(
                {"_id": sender_object_id},
                {"$addToSet": {"friend_requests_sent": receiver_object_id}}
            )
            
            # Add to receiver's received requests
            return self.collection.update_one(
                {"_id": receiver_object_id},
                {"$addToSet": {"friend_requests_received": sender_object_id}}
            )
        except Exception as e:
            print(f"Error in send_friend_request: {e}")
            # Return a mock result object for consistency
            class MockResult:
                modified_count = 0
            return MockResult()
    
    def accept_friend_request(self, user_id, friend_id):
        try:
            user_object_id = ObjectId(user_id)
            friend_object_id = ObjectId(friend_id)
            
            # Add each other as friends
            self.collection.update_one(
                {"_id": user_object_id},
                {
                    "$addToSet": {"friends": friend_object_id},
                    "$pull": {"friend_requests_received": friend_object_id}
                }
            )
            
            return self.collection.update_one(
                {"_id": friend_object_id},
                {
                    "$addToSet": {"friends": user_object_id},
                    "$pull": {"friend_requests_sent": user_object_id}
                }
            )
        except Exception as e:
            print(f"Error in accept_friend_request: {e}")
            class MockResult:
                modified_count = 0
            return MockResult()
    
    def reject_friend_request(self, user_id, friend_id):
        try:
            user_object_id = ObjectId(user_id)
            friend_object_id = ObjectId(friend_id)
            
            # Remove from both sent and received requests
            self.collection.update_one(
                {"_id": user_object_id},
                {"$pull": {"friend_requests_received": friend_object_id}}
            )
            
            return self.collection.update_one(
                {"_id": friend_object_id},
                {"$pull": {"friend_requests_sent": user_object_id}}
            )
        except Exception as e:
            print(f"Error in reject_friend_request: {e}")
            class MockResult:
                modified_count = 0
            return MockResult()
    
    def increment_beijjati_count(self, user_id):
        try:
            return self.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"beijjati_count": 1}}
            )
        except Exception as e:
            print(f"Error in increment_beijjati_count: {e}")
            class MockResult:
                modified_count = 0
            return MockResult()
    
    def get_friends(self, user_id):
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return []
            
            friend_ids = user.get('friends', [])
            if not friend_ids:  # If no friends, return empty list
                return []
            
            return list(self.collection.find(
                {"_id": {"$in": friend_ids}},
                {"password_hash": 0}
            ))
        except Exception as e:
            print(f"Error in get_friends: {e}")
            return []
    
    def get_friend_requests(self, user_id):
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return []
            
            request_ids = user.get('friend_requests_received', [])
            if not request_ids:  # If no friend requests, return empty list
                return []
            
            return list(self.collection.find(
                {"_id": {"$in": request_ids}},
                {"password_hash": 0}
            ))
        except Exception as e:
            print(f"Error in get_friend_requests: {e}")
            return []
