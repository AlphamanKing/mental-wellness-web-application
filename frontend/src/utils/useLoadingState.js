import { ref, onBeforeUnmount } from 'vue';

/**
 * Composable for managing loading states with timeouts and retries
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Default timeout in ms
 * @param {number} options.retryDelay - Delay between retries in ms
 * @param {number} options.maxRetries - Maximum number of retries
 * @returns {Object} Loading state utilities
 */
export function useLoadingState(options = {}) {
  const {
    timeout = 10000,
    retryDelay = 2000,
    maxRetries = 2
  } = options;
  
  // Tracking loading states for different operations
  const loadingStates = ref({});
  
  // Track abort controllers for cleanup
  const controllers = [];
  
  /**
   * Execute an async operation with loading state management
   * @param {string} key - Unique key to identify this loading operation
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Operation-specific options
   * @returns {Promise<any>} - Result of the operation
   */
  const executeWithLoading = async (key, asyncFn, options = {}) => {
    const {
      retries = maxRetries,
      showLoading = true,
      operationTimeout = timeout
    } = options;
    
    // Initialize or reset loading state for this key
    if (!loadingStates.value[key]) {
      loadingStates.value[key] = {
        loading: false,
        error: null,
        completed: false,
        retryCount: 0
      };
    }
    
    const state = loadingStates.value[key];
    
    // Reset state for new operation
    state.error = null;
    state.completed = false;
    
    if (showLoading) {
      state.loading = true;
    }
    
    // Create abort controller for this operation
    const controller = new AbortController();
    controllers.push(controller);
    
    try {
      // Set timeout if specified
      let timeoutId;
      if (operationTimeout > 0) {
        timeoutId = setTimeout(() => {
          controller.abort('Operation timed out');
        }, operationTimeout);
      }
      
      // Execute the operation
      const result = await asyncFn(controller.signal);
      
      // Clear timeout if it was set
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Mark as completed
      state.completed = true;
      state.retryCount = 0;
      
      return result;
    } catch (error) {
      state.error = error.message || 'Operation failed';
      
      // Auto-retry if requested and not manually aborted
      if (retries > 0 && state.retryCount < retries && error.name !== 'AbortError') {
        state.retryCount++;
        
        // Retry after delay
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(executeWithLoading(key, asyncFn, {
              ...options,
              retries: retries - 1
            }));
          }, retryDelay);
        });
      }
      
      throw error;
    } finally {
      if (showLoading) {
        state.loading = false;
      }
    }
  };
  
  /**
   * Check if a specific operation is loading
   * @param {string} key - Operation key
   * @returns {boolean} - Whether the operation is loading
   */
  const isLoading = (key) => {
    return loadingStates.value[key]?.loading || false;
  };
  
  /**
   * Get the error for a specific operation
   * @param {string} key - Operation key
   * @returns {string|null} - Error message or null
   */
  const getError = (key) => {
    return loadingStates.value[key]?.error || null;
  };
  
  /**
   * Check if a specific operation has completed successfully
   * @param {string} key - Operation key
   * @returns {boolean} - Whether the operation completed successfully
   */
  const isCompleted = (key) => {
    return loadingStates.value[key]?.completed || false;
  };
  
  /**
   * Abort all pending operations
   */
  const abortAll = () => {
    controllers.forEach(controller => {
      if (controller) {
        controller.abort();
      }
    });
    
    // Clear controllers array
    controllers.length = 0;
  };
  
  // Clean up on component unmount
  onBeforeUnmount(() => {
    abortAll();
  });
  
  return {
    loadingStates,
    executeWithLoading,
    isLoading,
    getError,
    isCompleted,
    abortAll
  };
} 