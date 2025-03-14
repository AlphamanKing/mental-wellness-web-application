import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.sentiment import analyze_sentiment
from api.groq_api import generate_response
from utils.auth import verify_firebase_token

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin SDK
cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if not os.path.exists(cred_path):
    print(f"Warning: Firebase credentials file not found at {cred_path}. Some features may not work properly.")
    # Initialize Firebase app with default config for testing
    try:
        firebase_admin.initialize_app()
    except ValueError:
        # App already initialized
        pass
else:
    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        # App already initialized
        pass
    
db = firestore.client()

@app.route('/', methods=['GET'])
def index():
    """
    Test endpoint to check if the API is working
    """
    return jsonify({
        'status': 'success',
        'message': 'Mental Wellness API is running'
    })

@app.route('/api/test_sentiment', methods=['POST'])
def test_sentiment():
    """
    Test endpoint to analyze sentiment without authentication
    """
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    message = data['message']
    result = analyze_sentiment(message)
    
    return jsonify({
        'message': message,
        'sentiment': result
    })

@app.route('/api/test_chat', methods=['POST'])
def test_chat():
    """
    Test endpoint to generate AI response without authentication
    """
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    message = data['message']
    
    # Analyze sentiment
    sentiment = analyze_sentiment(message)
    
    # Generate response
    conversation_history = data.get('conversation_history', [])
    response = generate_response(message, sentiment, conversation_history)
    
    return jsonify({
        'message': message,
        'sentiment': sentiment,
        'response': response
    })

@app.route('/api/analyze_sentiment', methods=['POST'])
def sentiment_analysis():
    """
    Endpoint to analyze sentiment of user message using BERT model
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get message from request
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    message = data['message']
    
    try:
        # Analyze sentiment
        sentiment_result = analyze_sentiment(message)
        return jsonify(sentiment_result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate_response', methods=['POST'])
def generate_response_api():
    try:
        logger.debug("Received request to /api/generate_response")
        # Get request data
        data = request.json
        logger.debug(f"Request data: {data}")
        
        message = data.get('message', '')
        sentiment = data.get('sentiment', {})
        conversation_id = data.get('conversation_id')
        
        # Get user ID from auth token
        auth_header = request.headers.get('Authorization')
        user_id = verify_firebase_token(auth_header)
        
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Get conversation history
        conversation_history = []
        if conversation_id:
            try:
                messages_ref = db.collection('conversations').document(user_id).collection('chats').document(conversation_id).collection('messages').order_by('timestamp').limit(20)
                messages = messages_ref.stream()
                
                for msg in messages:
                    msg_data = msg.to_dict()
                    conversation_history.append({
                        'role': 'user' if msg_data.get('sender') == 'user' else 'assistant',
                        'content': msg_data.get('content', '')
                    })
            except Exception as e:
                print(f"Error getting conversation history: {str(e)}")
        
        # Extract emotion from sentiment
        emotion = sentiment.get('emotion', 'neutral')
        
        # Generate AI response
        from api.groq_api import generate_response
        ai_response = generate_response(message, emotion, conversation_history)
        
        # Create new conversation if needed
        if not conversation_id:
            conversation_ref = db.collection('conversations').document(user_id).collection('chats').document()
            conversation_ref.set({
                'title': message[:30] + '...' if len(message) > 30 else message,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'last_message': message
            })
            conversation_id = conversation_ref.id
        else:
            # Update existing conversation
            conversation_ref = db.collection('conversations').document(user_id).collection('chats').document(conversation_id)
            conversation_ref.update({
                'updated_at': firestore.SERVER_TIMESTAMP,
                'last_message': message
            })
        
        # Add user message
        messages_ref = conversation_ref.collection('messages')
        messages_ref.add({
            'content': message,
            'sender': 'user',
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        # Add AI response
        messages_ref.add({
            'content': ai_response,
            'sender': 'ai',
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({
            'response': ai_response,
            'conversation_id': conversation_id
        }), 200
    
    except Exception as e:
        logger.error(f"Error in generate_response_api: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    """
    Endpoint to get all conversations for a user
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    try:
        # Get all conversations for the user
        conversations_ref = db.collection('conversations').document(user_id).collection('chats').order_by('updated_at', direction=firestore.Query.DESCENDING)
        conversations = conversations_ref.stream()
        
        result = []
        for conv in conversations:
            conv_data = conv.to_dict()
            result.append({
                'id': conv.id,
                'title': conv_data.get('title', 'Untitled Conversation'),
                'created_at': conv_data.get('created_at'),
                'updated_at': conv_data.get('updated_at')
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversation/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """
    Endpoint to get a specific conversation with all messages
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    try:
        # Get conversation details
        conversation_ref = db.collection('conversations').document(user_id).collection('chats').document(conversation_id)
        conversation = conversation_ref.get()
        
        if not conversation.exists:
            return jsonify({'error': 'Conversation not found'}), 404
        
        conv_data = conversation.to_dict()
        
        # Get all messages in the conversation
        messages_ref = conversation_ref.collection('messages').order_by('timestamp')
        messages = messages_ref.stream()
        
        messages_list = []
        for msg in messages:
            msg_data = msg.to_dict()
            messages_list.append({
                'id': msg.id,
                'content': msg_data.get('content'),
                'sender': msg_data.get('sender'),
                'timestamp': msg_data.get('timestamp'),
                'sentiment': msg_data.get('sentiment', None)
            })
        
        result = {
            'id': conversation_id,
            'title': conv_data.get('title', 'Untitled Conversation'),
            'created_at': conv_data.get('created_at'),
            'updated_at': conv_data.get('updated_at'),
            'messages': messages_list
        }
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mood', methods=['POST'])
def record_mood():
    """
    Endpoint to record user's mood
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get mood data from request
    data = request.get_json()
    if not data or 'mood' not in data or 'note' not in data:
        return jsonify({'error': 'Incomplete mood data provided'}), 400
    
    mood = data['mood']
    note = data['note']
    
    try:
        # Store mood in Firestore
        mood_ref = db.collection('moods').document(user_id).collection('entries').document()
        mood_ref.set({
            'mood': mood,
            'note': note,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({'success': True, 'id': mood_ref.id}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/moods', methods=['GET'])
def get_moods():
    """
    Endpoint to get mood history for a user
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get time range from query parameters
    days = request.args.get('days', default=30, type=int)
    
    try:
        # Get mood entries for the specified time range
        import datetime
        from_date = datetime.datetime.now() - datetime.timedelta(days=days)
        
        moods_ref = db.collection('moods').document(user_id).collection('entries')
        moods_ref = moods_ref.where('timestamp', '>=', from_date).order_by('timestamp')
        moods = moods_ref.stream()
        
        result = []
        for mood in moods:
            mood_data = mood.to_dict()
            result.append({
                'id': mood.id,
                'mood': mood_data.get('mood'),
                'note': mood_data.get('note'),
                'timestamp': mood_data.get('timestamp')
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/journal', methods=['POST'])
def create_journal():
    """
    Endpoint to create a journal entry
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get journal data from request
    data = request.get_json()
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'error': 'Incomplete journal data provided'}), 400
    
    title = data['title']
    content = data['content']
    share_with_ai = data.get('share_with_ai', False)
    
    try:
        # Store journal in Firestore
        journal_ref = db.collection('journals').document(user_id).collection('entries').document()
        journal_ref.set({
            'title': title,
            'content': content,
            'share_with_ai': share_with_ai,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({'success': True, 'id': journal_ref.id}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/journals', methods=['GET'])
def get_journals():
    """
    Endpoint to get journal entries for a user
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    try:
        # Get journal entries
        journals_ref = db.collection('journals').document(user_id).collection('entries').order_by('created_at', direction=firestore.Query.DESCENDING)
        journals = journals_ref.stream()
        
        result = []
        for journal in journals:
            journal_data = journal.to_dict()
            result.append({
                'id': journal.id,
                'title': journal_data.get('title'),
                'content': journal_data.get('content'),
                'share_with_ai': journal_data.get('share_with_ai', False),
                'created_at': journal_data.get('created_at'),
                'updated_at': journal_data.get('updated_at')
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/goals', methods=['POST'])
def create_goal():
    """
    Endpoint to create a mental health goal
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get goal data from request
    data = request.get_json()
    if not data or 'title' not in data or 'description' not in data or 'target_date' not in data:
        return jsonify({'error': 'Incomplete goal data provided'}), 400
    
    title = data['title']
    description = data['description']
    target_date = data['target_date']
    
    try:
        # Store goal in Firestore
        goal_ref = db.collection('goals').document(user_id).collection('items').document()
        goal_ref.set({
            'title': title,
            'description': description,
            'target_date': target_date,
            'completed': False,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({'success': True, 'id': goal_ref.id}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/goals', methods=['GET'])
def get_goals():
    """
    Endpoint to get mental health goals for a user
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    try:
        # Get goals
        goals_ref = db.collection('goals').document(user_id).collection('items').order_by('target_date')
        goals = goals_ref.stream()
        
        result = []
        for goal in goals:
            goal_data = goal.to_dict()
            result.append({
                'id': goal.id,
                'title': goal_data.get('title'),
                'description': goal_data.get('description'),
                'target_date': goal_data.get('target_date'),
                'completed': goal_data.get('completed', False),
                'created_at': goal_data.get('created_at'),
                'updated_at': goal_data.get('updated_at')
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/goal/<goal_id>', methods=['PUT'])
def update_goal(goal_id):
    """
    Endpoint to update a mental health goal
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get goal data from request
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Update goal in Firestore
        goal_ref = db.collection('goals').document(user_id).collection('items').document(goal_id)
        goal = goal_ref.get()
        
        if not goal.exists:
            return jsonify({'error': 'Goal not found'}), 404
        
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'target_date' in data:
            update_data['target_date'] = data['target_date']
        if 'completed' in data:
            update_data['completed'] = data['completed']
        
        update_data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        goal_ref.update(update_data)
        
        return jsonify({'success': True}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """
    Endpoint to get user profile information
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    try:
        # Get user data from Firebase Auth
        user = auth.get_user(user_id)
        
        # Get additional user data from Firestore
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        user_data = {
            'uid': user.uid,
            'email': user.email,
            'displayName': user.display_name,
            'photoURL': user.photo_url,
            'emailVerified': user.email_verified,
            'createdAt': user.user_metadata.creation_timestamp
        }
        
        # Add additional data from Firestore if it exists
        if user_doc.exists:
            firestore_data = user_doc.to_dict()
            user_data.update({
                'bio': firestore_data.get('bio', ''),
                'preferences': firestore_data.get('preferences', {})
            })
        
        return jsonify(user_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/profile', methods=['PUT'])
def update_user_profile():
    """
    Endpoint to update user profile information
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get data from request
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Update user data in Firestore
        user_ref = db.collection('users').document(user_id)
        
        # Only allow certain fields to be updated
        allowed_fields = ['displayName', 'bio', 'preferences']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        # Update display name in Firebase Auth if provided
        if 'displayName' in update_data:
            auth.update_user(
                user_id,
                display_name=update_data['displayName']
            )
        
        # Update data in Firestore
        user_ref.set(update_data, merge=True)
        
        return jsonify({'message': 'Profile updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/stats', methods=['GET'])
def get_user_stats():
    """
    Endpoint to get user activity statistics
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    try:
        # Get conversation count
        conversations_ref = db.collection('conversations').document(user_id).collection('chats')
        conversation_count = len(list(conversations_ref.stream()))
        
        # Get journal entry count
        journals_ref = db.collection('journals').document(user_id).collection('entries')
        journal_count = len(list(journals_ref.stream()))
        
        # Get mood entry count
        moods_ref = db.collection('moods').document(user_id).collection('entries')
        mood_count = len(list(moods_ref.stream()))
        
        # Get goal count
        goals_ref = db.collection('goals').document(user_id).collection('items')
        goal_count = len(list(goals_ref.stream()))
        completed_goals_ref = goals_ref.where('completed', '==', True)
        completed_goal_count = len(list(completed_goals_ref.stream()))
        
        # Calculate average mood if there are mood entries
        average_mood = None
        if mood_count > 0:
            mood_values = [doc.to_dict()['value'] for doc in moods_ref.stream()]
            average_mood = sum(mood_values) / len(mood_values)
        
        stats = {
            'conversationCount': conversation_count,
            'journalCount': journal_count,
            'moodCount': mood_count,
            'goalCount': goal_count,
            'completedGoalCount': completed_goal_count,
            'averageMood': average_mood
        }
        
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
