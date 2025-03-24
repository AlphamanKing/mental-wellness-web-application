import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Cache for storing API responses
const apiCache = new Map();
const CACHE_EXPIRY = 30000; // 30 seconds

/**
 * API client with caching and timeout handling
 */
const apiClient = {
  /**
   * Base API URL from environment
   */
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  /**
   * Default timeout for requests (10 seconds)
   */
  timeout: 10000,
  
  /**
   * Get auth token with retry logic
   * @private
   * @returns {Promise<string|null>} Auth token or null
   */
  async getAuthToken() {
    const auth = getAuth();
    if (!auth.currentUser) return null;
    
    try {
      // Try to get the token
      return await auth.currentUser.getIdToken(true); // Force token refresh
    } catch (error) {
      console.error('[API] Error getting auth token:', error);
      return null;
    }
  },
  
  /**
   * Make a GET request with caching
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {boolean} options.cache - Whether to cache the response
   * @param {number} options.cacheTime - Cache expiry time in ms
   * @param {Object} options.params - URL parameters
   * @param {AbortSignal} options.signal - AbortController signal
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, { cache = true, cacheTime = CACHE_EXPIRY, params = {}, signal } = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
    
    // Check cache first if caching is enabled
    if (cache) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData && Date.now() < cachedData.expiry) {
        console.log(`[API] Using cached response for ${cacheKey}`);
        return cachedData.data;
      }
    }
    
    try {
      // Get auth token
      const token = await this.getAuthToken();
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make the request
      const response = await axios.get(url, {
        headers,
        params,
        signal,
        timeout: this.timeout
      });
      
      // Store in cache if caching is enabled
      if (cache) {
        apiCache.set(cacheKey, {
          data: response.data,
          expiry: Date.now() + cacheTime
        });
      }
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @param {AbortSignal} options.signal - AbortController signal
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data = {}, { signal } = {}) {
    try {
      // Get auth token
      const token = await this.getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make the request
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
        headers,
        signal,
        timeout: this.timeout
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @param {AbortSignal} options.signal - AbortController signal
   * @returns {Promise<any>} - Response data
   */
  async put(endpoint, data = {}, { signal } = {}) {
    try {
      // Get auth token
      const token = await this.getAuthToken();
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make the request
      const response = await axios.put(`${this.baseURL}${endpoint}`, data, {
        headers,
        signal,
        timeout: this.timeout
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },
  
  /**
   * Clear API cache
   * @param {string} endpoint - Specific endpoint to clear (optional)
   */
  clearCache(endpoint = null) {
    if (endpoint) {
      // Clear cache for specific endpoint
      const prefix = `${this.baseURL}${endpoint}`;
      for (const key of apiCache.keys()) {
        if (key.startsWith(prefix)) {
          apiCache.delete(key);
        }
      }
    } else {
      // Clear entire cache
      apiCache.clear();
    }
  },
  
  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @private
   */
  handleError(error) {
    if (axios.isCancel(error)) {
      console.warn('Request canceled:', error.message);
      return;
    }
    
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error(
        `[API] Error ${error.response.status}: ${
          error.response.data?.error || error.message
        }`
      );
    } else if (error.request) {
      // Request was made but no response was received
      console.error('[API] No response received:', error.message);
      
      // Check if this is potentially a CORS error
      if (error.message === 'Network Error') {
        console.error('[API] This appears to be a CORS issue. Make sure your backend has proper CORS headers and is running.');
        console.error('[API] Check that your backend server is running at ' + this.baseURL);
      }
    } else {
      // Something else happened while setting up the request
      console.error('[API] Request error:', error.message);
    }
  }
};

export default apiClient; 