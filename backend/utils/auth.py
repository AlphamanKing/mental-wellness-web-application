import firebase_admin
from firebase_admin import auth

def verify_firebase_token(auth_header):
    """
    Verify Firebase ID token from Authorization header
    
    Args:
        auth_header (str): Authorization header from request
        
    Returns:
        str: User ID if token is valid, None otherwise
    """
    if not auth_header:
        return None
    
    # Extract token from Authorization header
    # Format: "Bearer <token>"
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    token = parts[1]
    
    try:
        # Verify token
        decoded_token = auth.verify_id_token(token)
        
        # Get user ID from token
        user_id = decoded_token['uid']
        
        return user_id
    
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        return None
