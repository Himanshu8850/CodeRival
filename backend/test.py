from pymongo import MongoClient

uri = "mongodb+srv://somgester:somgester123@cluster0.grzqpfa.mongodb.net/beizzati_tracker?retryWrites=true&w=majority&tls=true"
client = MongoClient(uri)
print(client.list_database_names())