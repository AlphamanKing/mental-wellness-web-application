import os
import sys
import logging
import time
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud import storage

# Configure logging
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
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}}, supports_credentials=True)

# Handle CORS pre-flight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

# Handle any errors with CORS headers
@app.errorhandler(Exception)
def handle_error(e):
    response = jsonify({"error": str(e)})
    response.status_code = 500
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'profile_images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB limit

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
        default_app = firebase_admin.initialize_app(cred)
    except ValueError:
        # App already initialized
        default_app = firebase_admin.get_app()
        pass

# Get Firebase project details from environment if available
firebase_storage_bucket = os.getenv('VITE_FIREBASE_STORAGE_BUCKET')
firebase_project_id = os.getenv('VITE_FIREBASE_PROJECT_ID')

logger.info(f"Firebase Storage Bucket from ENV: {firebase_storage_bucket}")
logger.info(f"Firebase Project ID from ENV: {firebase_project_id}")

# Initialize Firestore client    
db = firestore.client()

# Initialize Storage client
try:
    if os.path.exists(cred_path):
        storage_client = storage.Client.from_service_account_json(cred_path)
        logger.info(f"Storage client initialized with project: {storage_client.project}")
    else:
        storage_client = None
        logger.warning("Firebase credentials file not found. Storage client not initialized. File uploads will not work.")
except Exception as e:
    storage_client = None
    logger.error(f"Error initializing storage client: {str(e)}", exc_info=True)
    logger.warning("File uploads will not work due to storage client initialization failure.")

# Base URL for the server
SERVER_BASE_URL = os.getenv('SERVER_BASE_URL', 'http://localhost:5000')

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

@app.route('/api/mood/recent', methods=['GET'])
def get_recent_moods():
    """
    Endpoint to get recent mood entries for a user
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get limit from query parameters
    limit = request.args.get('limit', default=5, type=int)
    
    try:
        # Get recent mood entries
        moods_ref = db.collection('moods').document(user_id).collection('entries')
        moods_ref = moods_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
        moods = moods_ref.stream()
        
        result = []
        for mood in moods:
            mood_data = mood.to_dict()
            timestamp = mood_data.get('timestamp')
            result.append({
                'id': mood.id,
                'score': mood_data.get('mood'),
                'note': mood_data.get('note'),
                'timestamp': {
                    '_seconds': timestamp.timestamp() if timestamp else None,
                    '_nanoseconds': 0
                }
            })
        
        return jsonify(result), 200
    
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
            timestamp = mood_data.get('timestamp')
            result.append({
                'id': mood.id,
                'score': mood_data.get('mood'),
                'note': mood_data.get('note'),
                'timestamp': {
                    '_seconds': timestamp.timestamp() if timestamp else None,
                    '_nanoseconds': 0
                }
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

@app.route('/api/journal/entries', methods=['GET'])
def get_journal_entries():
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
    
    # Get limit from query parameters
    limit = request.args.get('limit', default=3, type=int)
    
    try:
        # Get journal entries
        journals_ref = db.collection('journals').document(user_id).collection('entries')
        journals_ref = journals_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
        journals = journals_ref.stream()
        
        result = []
        for journal in journals:
            journal_data = journal.to_dict()
            created_at = journal_data.get('created_at')
            updated_at = journal_data.get('updated_at')
            
            # Format timestamps consistently
            created_at_dict = {
                '_seconds': created_at.timestamp() if created_at else None,
                '_nanoseconds': 0
            }
            
            updated_at_dict = {
                '_seconds': updated_at.timestamp() if updated_at else None,
                '_nanoseconds': 0
            }
            
            result.append({
                'id': journal.id,
                'title': journal_data.get('title'),
                'content': journal_data.get('content'),
                'share_with_ai': journal_data.get('share_with_ai', False),
                'created_at': created_at_dict,
                'updated_at': updated_at_dict
            })
        
        return jsonify(result), 200
    
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
            created_at = journal_data.get('created_at')
            updated_at = journal_data.get('updated_at')
            
            # Format timestamps consistently
            created_at_dict = {
                '_seconds': created_at.timestamp() if created_at else None,
                '_nanoseconds': 0
            }
            
            updated_at_dict = {
                '_seconds': updated_at.timestamp() if updated_at else None,
                '_nanoseconds': 0
            }
            
            result.append({
                'id': journal.id,
                'title': journal_data.get('title'),
                'content': journal_data.get('content'),
                'share_with_ai': journal_data.get('share_with_ai', False),
                'created_at': created_at_dict,
                'updated_at': updated_at_dict
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
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Log received data for debugging
    logger.debug(f"Received goal data: {data}")
    
    # Extract data, checking for both possible key names
    title = data.get('title')
    description = data.get('description', '')
    category = data.get('category', 'Other')
    
    # Check for both target_date and due_date keys
    target_date = data.get('target_date')
    if target_date is None:
        target_date = data.get('due_date')
    
    # Validate required fields
    if not title or not target_date:
        return jsonify({'error': 'Incomplete goal data provided. Title and target_date are required.'}), 400
    
    try:
        # Store goal in Firestore
        goal_ref = db.collection('goals').document(user_id).collection('items').document()
        goal_ref.set({
            'title': title,
            'description': description,
            'category': category,
            'target_date': target_date,
            'completed': False,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({'success': True, 'id': goal_ref.id}), 200
    
    except Exception as e:
        logger.error(f"Error creating goal: {str(e)}", exc_info=True)
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
        
        # Handle each field separately
        if 'title' in data:
            update_data['title'] = str(data['title'])
            
        if 'description' in data:
            update_data['description'] = str(data['description'])
            
        if 'target_date' in data:
            # Ensure target_date is a string in YYYY-MM-DD format
            try:
                from datetime import datetime
                if isinstance(data['target_date'], str):
                    # Try to parse and format the date
                    date_obj = datetime.strptime(data['target_date'], '%Y-%m-%d')
                    update_data['target_date'] = date_obj.strftime('%Y-%m-%d')
                else:
                    return jsonify({'error': 'target_date must be a string in YYYY-MM-DD format'}), 400
            except ValueError:
                return jsonify({'error': 'Invalid target_date format. Use YYYY-MM-DD'}), 400
                
        if 'completed' in data:
            # Ensure completed is a boolean
            if isinstance(data['completed'], bool):
                update_data['completed'] = data['completed']
            else:
                return jsonify({'error': 'completed must be a boolean'}), 400
        
        # Always update the updated_at timestamp
        update_data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        # Log the update data for debugging
        logger.debug(f"Updating goal {goal_id} with data: {update_data}")
        
        goal_ref.update(update_data)
        
        return jsonify({'success': True}), 200
    
    except Exception as e:
        logger.error(f"Error updating goal: {str(e)}", exc_info=True)
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

@app.route('/api/user/profile/image', methods=['POST'])
def upload_profile_image():
    """
    Endpoint to upload user profile image using local file storage
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    try:
        # Check if the request has the file part
        if 'profileImage' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        
        file = request.files['profileImage']
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Check file type
        if not file.content_type.startswith('image/'):
            return jsonify({'error': 'Only image files are allowed'}), 400
        
        # Create user directory if it doesn't exist
        user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], user_id)
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Create a unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        filepath = os.path.join(user_upload_dir, unique_filename)
        
        # Save the file
        logger.info(f"Saving file to {filepath}")
        file.save(filepath)
        
        # Generate a URL to access the image
        image_url = f"{SERVER_BASE_URL}/uploads/profile_images/{user_id}/{unique_filename}"
        logger.info(f"Image URL: {image_url}")
        
        try:
            # Update user profile in Firebase Auth
            auth.update_user(
                user_id,
                photo_url=image_url
            )
            logger.info("Firebase Auth profile updated with new image URL")
        except Exception as e:
            logger.error(f"Error updating Firebase Auth profile: {str(e)}", exc_info=True)
            # Continue even if this fails, as we still have the image URL
        
        try:
            # Update user profile in Firestore
            user_ref = db.collection('users').document(user_id)
            user_ref.set({
                'photoURL': image_url
            }, merge=True)
            logger.info("Firestore profile updated with new image URL")
        except Exception as e:
            logger.error(f"Error updating Firestore profile: {str(e)}", exc_info=True)
            # Continue even if this fails, as we still have the image URL
        
        return jsonify({
            'message': 'Profile image uploaded successfully',
            'imageUrl': image_url
        }), 200
    
    except Exception as e:
        logger.error(f"Error uploading profile image: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# Add a route to serve the uploaded images
@app.route('/uploads/<path:filename>', methods=['GET'])
def serve_file(filename):
    """
    Serve uploaded files
    """
    upload_folder = os.path.dirname(app.config['UPLOAD_FOLDER'])
    return send_from_directory(upload_folder, filename)

@app.route('/api/chat/conversations', methods=['GET'])
def get_chat_conversations():
    """
    Endpoint to get chat conversations for a user
    """
    # Verify Firebase token
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization header provided'}), 401
    
    user_id = verify_firebase_token(auth_header)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Get limit from query parameters
    limit = request.args.get('limit', default=3, type=int)
    
    try:
        # Get all conversations for the user
        conversations_ref = db.collection('conversations').document(user_id).collection('chats')
        conversations_ref = conversations_ref.order_by('updated_at', direction=firestore.Query.DESCENDING).limit(limit)
        conversations = conversations_ref.stream()
        
        result = []
        for conv in conversations:
            conv_data = conv.to_dict()
            result.append({
                'id': conv.id,
                'title': conv_data.get('title', 'Untitled Conversation'),
                'last_message': conv_data.get('last_message', ''),
                'created_at': conv_data.get('created_at'),
                'updated_at': conv_data.get('updated_at')
            })
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
