<template>
  <div>
    <div v-if="error" class="error-boundary">
      <div class="error-container">
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8">
            <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
          </svg>
        </div>
        <h2 class="error-title">{{ title }}</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-actions">
          <button 
            v-if="canRetry" 
            @click="retry" 
            class="retry-button"
          >
            Try Again
          </button>
          <button 
            v-if="showDetails" 
            @click="toggleDetails" 
            class="details-button"
          >
            {{ showingDetails ? 'Hide Details' : 'Show Details' }}
          </button>
        </div>
        <div v-if="showingDetails" class="error-details">
          <pre>{{ errorDetails }}</pre>
        </div>
      </div>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script setup>
import { ref, computed, onErrorCaptured } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Something went wrong'
  },
  fallbackMessage: {
    type: String,
    default: 'We encountered an error while trying to display this content.'
  },
  canRetry: {
    type: Boolean,
    default: true
  },
  showDetails: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['retry', 'error']);

const error = ref(null);
const showingDetails = ref(false);

// Reset error state
const resetError = () => {
  error.value = null;
  showingDetails.value = false;
};

// Handle retry action
const retry = () => {
  resetError();
  emit('retry');
};

// Toggle error details visibility
const toggleDetails = () => {
  showingDetails.value = !showingDetails.value;
};

// Computed user-friendly error message
const errorMessage = computed(() => {
  if (!error.value) return props.fallbackMessage;
  
  if (typeof error.value === 'string') {
    return error.value;
  }
  
  if (error.value instanceof Error) {
    return error.value.message || props.fallbackMessage;
  }
  
  return props.fallbackMessage;
});

// Computed technical error details for developers
const errorDetails = computed(() => {
  if (!error.value) return '';
  
  if (error.value instanceof Error) {
    return `${error.value.name}: ${error.value.message}\n${error.value.stack || ''}`;
  }
  
  return JSON.stringify(error.value, null, 2);
});

// Capture errors from child components
onErrorCaptured((err, instance, info) => {
  error.value = err;
  emit('error', { error: err, instance, info });
  return false; // Prevent error from propagating further
});

// Expose methods to parent components
defineExpose({
  setError: (err) => {
    error.value = err;
    emit('error', { error: err });
  },
  clearError: resetError
});
</script>

<style scoped>
.error-boundary {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 1rem;
}

.error-container {
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  text-align: center;
  max-width: 32rem;
  width: 100%;
}

.error-icon {
  display: flex;
  justify-content: center;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.error-message {
  color: #4b5563;
  margin-bottom: 1.5rem;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.retry-button {
  background-color: #4f46e5;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #4338ca;
}

.details-button {
  background-color: #f3f4f6;
  color: #4b5563;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.details-button:hover {
  background-color: #e5e7eb;
}

.error-details {
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  padding: 1rem;
  text-align: left;
  overflow-x: auto;
}

.error-details pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.875rem;
  color: #4b5563;
}
</style> 