import os
import requests
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define emotion labels from the go_emotions dataset
EMOTIONS = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring', 'confusion',
    'curiosity', 'desire', 'disappointment', 'disapproval', 'disgust', 'embarrassment',
    'excitement', 'fear', 'gratitude', 'grief', 'joy', 'love', 'nervousness', 'optimism',
    'pride', 'realization', 'relief', 'remorse', 'sadness', 'surprise', 'neutral'
]

# Map emotions to sentiment scores
EMOTION_SENTIMENT_MAP = {
    'admiration': 0.7, 'amusement': 0.8, 'anger': -0.8, 'annoyance': -0.5, 
    'approval': 0.6, 'caring': 0.7, 'confusion': -0.2, 'curiosity': 0.3, 
    'desire': 0.5, 'disappointment': -0.6, 'disapproval': -0.6, 'disgust': -0.7, 
    'embarrassment': -0.4, 'excitement': 0.8, 'fear': -0.7, 'gratitude': 0.8, 
    'grief': -0.9, 'joy': 0.9, 'love': 0.9, 'nervousness': -0.5, 'optimism': 0.8, 
    'pride': 0.7, 'realization': 0.4, 'relief': 0.6, 'remorse': -0.6, 
    'sadness': -0.8, 'surprise': 0.2, 'neutral': 0.0
}

HF_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
MODEL_NAME = 'SamLowe/roberta-base-go_emotions'

def analyze_sentiment(text):
    """
    Analyze text using Hugging Face Inference API
    """
    headers = {
        'Authorization': f'Bearer {HF_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'inputs': text,
        'parameters': {'truncation': True}
    }
    
    try:
        response = requests.post(
            f'https://api-inference.huggingface.co/models/{MODEL_NAME}',
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return process_api_response(response.json())
    except Exception as e:
        print(f"Error calling Hugging Face API: {str(e)}")
        return fallback_sentiment_analysis(text)

def process_api_response(api_response):
    """
    Process raw API response into standardized format
    """
    try:
        # Handle different response formats from Hugging Face
        if isinstance(api_response, list) and len(api_response) > 0:
            if isinstance(api_response[0], list):
                # Format: [[{'label': 'joy', 'score': 0.9}, ...]]
                emotions_data = api_response[0]
                emotions_dict = {item['label']: float(item['score']) for item in emotions_data}
                
                # Get primary emotion (highest score)
                primary_emotion = max(emotions_dict.items(), key=lambda x: x[1])
                emotion_name = primary_emotion[0]
                confidence = primary_emotion[1]
            elif isinstance(api_response[0], dict) and 'label' in api_response[0]:
                # Format: [{'label': 'joy', 'score': 0.9}, ...]
                emotions_dict = {item['label']: float(item['score']) for item in api_response}
                
                # Get primary emotion (highest score)
                primary_emotion = max(emotions_dict.items(), key=lambda x: x[1])
                emotion_name = primary_emotion[0]
                confidence = primary_emotion[1]
            else:
                # Format with logits: [[0.1, 0.2, ...]]
                logits = api_response[0]
                # Convert logits to probabilities using softmax
                exp_logits = np.exp(logits)
                probs = exp_logits / np.sum(exp_logits)
                
                # Get emotions dictionary
                emotions_dict = {EMOTIONS[i]: float(probs[i]) for i in range(len(EMOTIONS))}
                
                # Get primary emotion (highest probability)
                primary_emotion_idx = np.argmax(probs)
                emotion_name = EMOTIONS[primary_emotion_idx]
                confidence = float(probs[primary_emotion_idx])
        else:
            # Unknown format, use fallback
            print("Unknown API response format, using fallback")
            return fallback_sentiment_analysis(text)
        
        # Calculate sentiment score based on emotion
        sentiment_score = EMOTION_SENTIMENT_MAP.get(emotion_name, 0.0)
        
        return {
            'sentiment_score': sentiment_score,
            'emotion': emotion_name,
            'emotions': emotions_dict,
            'confidence': confidence
        }
    except Exception as e:
        print(f"Error processing API response: {str(e)}")
        return fallback_sentiment_analysis(text)

def fallback_sentiment_analysis(text):
    """
    Simple rule-based sentiment analysis as fallback
    """
    print("Using fallback sentiment analysis")
    
    # Simple rule-based sentiment analysis
    positive_words = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy', 'positive', 'hope']
    negative_words = ['sad', 'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'depressed', 'anxiety', 'fear', 'worry']
    
    text_lower = text.lower()
    
    # Count positive and negative words
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    # Calculate sentiment score
    total_count = positive_count + negative_count
    if total_count == 0:
        sentiment_score = 0
    else:
        sentiment_score = (positive_count - negative_count) / total_count
    
    # Determine primary emotion
    if sentiment_score > 0.5:
        emotion = 'joy'
    elif sentiment_score > 0:
        emotion = 'optimism'
    elif sentiment_score > -0.5:
        emotion = 'sadness'
    else:
        emotion = 'grief'
    
    confidence = 0.5  # Default confidence for fallback mechanism
    
    # Create a simple emotions dictionary
    emotions_dict = {e: 0.1 for e in EMOTIONS}
    emotions_dict[emotion] = confidence
    
    return {
        'sentiment_score': sentiment_score,
        'emotion': emotion,
        'emotions': emotions_dict,
        'confidence': confidence,
        'note': 'Fallback sentiment analysis used'
    }
