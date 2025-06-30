from bson import ObjectId
from datetime import datetime

class Post:
    def __init__(self, db):
        self.collection = db.posts
        self.users_collection = db.users
    
    def create_post(self, author_id, content, is_beizzati=False, mentioned_users=None):
        if mentioned_users is None:
            mentioned_users = []
        
        # Validate author_id
        try:
            author_object_id = ObjectId(author_id)
        except:
            return None
        
        # Get author's friends to determine visibility
        author = self.users_collection.find_one({"_id": author_object_id})
        if not author:
            return None
        
        # Convert mentioned user IDs to ObjectIds and validate them
        mentioned_object_ids = []
        for mentioned_user_id in mentioned_users:
            try:
                mentioned_object_id = ObjectId(mentioned_user_id)
                # Verify the user exists
                if self.users_collection.find_one({"_id": mentioned_object_id}):
                    mentioned_object_ids.append(mentioned_object_id)
            except:
                continue  # Skip invalid IDs
        
        # If it's a beijjati post, increment mentioned users' beijjati count
        if is_beizzati and mentioned_object_ids:
            for mentioned_object_id in mentioned_object_ids:
                self.users_collection.update_one(
                    {"_id": mentioned_object_id},
                    {"$inc": {"beijjati_count": 1}}
                )
        
        post_data = {
            "author_id": author_object_id,
            "content": content,
            "is_beizzati": is_beizzati,
            "mentioned_users": mentioned_object_ids,
            "visible_to": author.get('friends', []),
            "likes": [],
            "comments": [],
            "created_at": datetime.utcnow()
        }
        
        result = self.collection.insert_one(post_data)
        return str(result.inserted_id)
    
    def get_posts_for_user(self, user_id):
        """Get posts visible to a user (from friends and their own posts)"""
        try:
            user_object_id = ObjectId(user_id)
            user = self.users_collection.find_one({"_id": user_object_id})
            if not user:
                return []
            
            # Posts visible to user: their own posts + posts from friends
            visible_posts = list(self.collection.find({
                "$or": [
                    {"author_id": user_object_id},  # User's own posts
                    {"visible_to": user_object_id}  # Posts user is in visible_to list
                ]
            }).sort("created_at", -1))
            
            # Populate author information
            for post in visible_posts:
                author = self.users_collection.find_one(
                    {"_id": post["author_id"]},
                    {"password_hash": 0}
                )
                post["author"] = author
                
                # Populate mentioned users
                mentioned_users = []
                for mentioned_id in post.get("mentioned_users", []):
                    mentioned_user = self.users_collection.find_one(
                        {"_id": mentioned_id},
                        {"username": 1, "_id": 1}
                    )
                    if mentioned_user:
                        mentioned_users.append(mentioned_user)
                post["mentioned_users_details"] = mentioned_users
            
            return visible_posts
        except Exception as e:
            print(f"Error in get_posts_for_user: {e}")
            return []
    
    def get_posts_by_user(self, user_id):
        """Get all posts by a specific user"""
        try:
            user_object_id = ObjectId(user_id)
            posts = list(self.collection.find({
                "author_id": user_object_id
            }).sort("created_at", -1))
            
            # Populate author information
            author = self.users_collection.find_one(
                {"_id": user_object_id},
                {"password_hash": 0}
            )
            
            for post in posts:
                post["author"] = author
                
                # Populate mentioned users
                mentioned_users = []
                for mentioned_id in post.get("mentioned_users", []):
                    mentioned_user = self.users_collection.find_one(
                        {"_id": mentioned_id},
                        {"username": 1, "_id": 1}
                    )
                    if mentioned_user:
                        mentioned_users.append(mentioned_user)
                post["mentioned_users_details"] = mentioned_users
            
            return posts
        except Exception as e:
            print(f"Error in get_posts_by_user: {e}")
            return []
    
    def get_mentions_for_user(self, user_id):
        """Get posts where user is mentioned"""
        try:
            user_object_id = ObjectId(user_id)
            posts = list(self.collection.find({
                "mentioned_users": user_object_id
            }).sort("created_at", -1))
            
            # Populate author information
            for post in posts:
                author = self.users_collection.find_one(
                    {"_id": post["author_id"]},
                    {"password_hash": 0}
                )
                post["author"] = author
                
                # Populate mentioned users
                mentioned_users = []
                for mentioned_id in post.get("mentioned_users", []):
                    mentioned_user = self.users_collection.find_one(
                        {"_id": mentioned_id},
                        {"username": 1, "_id": 1}
                    )
                    if mentioned_user:
                        mentioned_users.append(mentioned_user)
                post["mentioned_users_details"] = mentioned_users
            
            return posts
        except Exception as e:
            print(f"Error in get_mentions_for_user: {e}")
            return []
    
    def like_post(self, post_id, user_id):
        try:
            return self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$addToSet": {"likes": ObjectId(user_id)}}
            )
        except Exception as e:
            print(f"Error in like_post: {e}")
            class MockResult:
                modified_count = 0
            return MockResult()
    
    def unlike_post(self, post_id, user_id):
        try:
            return self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$pull": {"likes": ObjectId(user_id)}}
            )
        except Exception as e:
            print(f"Error in unlike_post: {e}")
            class MockResult:
                modified_count = 0
            return MockResult()
