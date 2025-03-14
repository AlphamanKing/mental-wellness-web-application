import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Groq API key from environment variables
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def generate_response(message, emotion, conversation_history=None):
    """
    Generate a response using the Groq API
    
    Args:
        message (str): The user's message
        emotion (str): The detected emotion
        conversation_history (list): Previous conversation messages
        
    Returns:
        str: The AI response
    """
    try:
        # Get API key from environment variable
        api_key = os.getenv('GROQ_API_KEY')
        
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        
        # Prepare conversation history for the API
        messages = []
        
        # Add system message with context about the user's emotion
        system_message = f"""You are an empathetic AI therapist. The user's message indicates they may be feeling {emotion}. 
        Respond with empathy and understanding. Provide supportive guidance without making medical diagnoses or prescribing treatments.
        Focus on active listening, validation, and suggesting healthy coping strategies."""
        
        messages.append({"role": "system", "content": system_message})
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add the current user message
        messages.append({"role": "user", "content": message})
        
        # Prepare the API request
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "llama3-8b-8192",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 800
        }
        
        # Make the API request
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        # Parse the response
        response_data = response.json()
        ai_response = response_data['choices'][0]['message']['content']
        
        return ai_response
        
    except Exception as e:
        # If the Groq API is unavailable, use a fallback response
        print(f"Error calling Groq API: {str(e)}")
        print("Using fallback response")
        
        # Fallback responses based on emotion
        fallback_responses = {
            'happy': "I'm glad to hear you're feeling positive! It's wonderful that you're experiencing these good emotions. Would you like to share more about what's contributing to your happiness?",
            'content': "It sounds like you're in a relatively balanced state. How can I support you today?",
            'neutral': "Thank you for sharing that with me. I'm here to listen and support you. Would you like to explore this topic further?",
            'sad': "I'm sorry to hear you're feeling down. It's completely normal to experience sadness, and I'm here to listen. Would you like to talk more about what's troubling you?",
            'depressed': "I can sense that you're going through a difficult time. Please remember that you're not alone, and it's brave of you to reach out. Would it help to discuss some coping strategies that might provide some relief?",
            'angry': "I can understand feeling frustrated or angry. These emotions are valid and important. Would it help to explore what triggered these feelings?",
            'anxious': "It sounds like you might be experiencing some anxiety. This is a common feeling that many people face. Would you like to try some grounding techniques that might help in the moment?"
        }
        
        # Get appropriate fallback response based on emotion
        response = fallback_responses.get(emotion, fallback_responses['neutral'])
        
        return response + "\n\n(Note: This is a fallback response due to a temporary issue connecting to our AI system. Your message will be processed properly once the connection is restored.)"
