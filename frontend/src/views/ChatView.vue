<template>
  <div class="bg-neutral-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Sidebar with conversation list -->
        <div class="w-full md:w-1/4 bg-white rounded-xl shadow-soft p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">Conversations</h2>
            <button 
              @click="startNewConversation" 
              class="text-primary-600 hover:text-primary-700"
              :disabled="loading"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div v-if="loading && !conversationId" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          
          <div v-else-if="conversations.length === 0" class="text-center py-8">
            <p class="text-neutral-600 mb-4">No conversations yet</p>
            <button @click="startNewConversation" class="btn btn-primary">
              Start New Conversation
            </button>
          </div>
          
          <div v-else class="space-y-2 overflow-y-auto max-h-[calc(100vh-240px)]">
            <div 
              v-for="conversation in conversations" 
              :key="conversation.id" 
              @click="selectConversation(conversation.id)"
              class="p-3 rounded-lg cursor-pointer transition-colors"
              :class="conversation.id === conversationId ? 'bg-primary-50 border border-primary-200' : 'bg-neutral-50 hover:bg-neutral-100'"
            >
              <div class="flex justify-between items-start">
                <span class="font-medium text-neutral-900 truncate">{{ conversation.title || 'Conversation' }}</span>
                <span class="text-xs text-neutral-500 whitespace-nowrap ml-2">{{ formatDate(conversation.updated_at) }}</span>
              </div>
              <p class="text-sm text-neutral-600 mt-1 truncate">
                {{ conversation.last_message || 'Start chatting with your AI therapist' }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Main chat area -->
        <div class="w-full md:w-3/4 bg-white rounded-xl shadow-soft flex flex-col h-[calc(100vh-160px)]">
          <!-- Chat header -->
          <div class="p-4 border-b border-neutral-200">
            <h2 class="text-xl font-semibold text-neutral-900">
              {{ currentConversation?.title || 'New Conversation' }}
            </h2>
          </div>
          
          <!-- Messages area -->
          <div 
            ref="messagesContainer" 
            class="flex-grow p-4 overflow-y-auto"
            :class="{ 'flex items-center justify-center': messages.length === 0 && !isTyping && !conversationId }"
          >
            <div v-if="messages.length === 0 && !isTyping && !conversationId" class="text-center">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-neutral-900 mb-2">Start a conversation</h3>
              <p class="text-neutral-600 mb-4">
                Chat with your AI therapist about anything that's on your mind.
              </p>
            </div>
            
            <div v-else>
              <div v-for="(message, index) in messages" :key="index" class="mb-4">
                <div 
                  class="flex"
                  :class="message.sender === 'user' ? 'justify-end' : 'justify-start'"
                >
                  <div 
                    class="max-w-[80%] rounded-lg p-3"
                    :class="message.sender === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-neutral-100 text-neutral-800 rounded-tl-none'"
                  >
                    <div v-if="message.sender === 'ai'" class="flex items-center mb-1">
                      <div class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium text-xs mr-2">
                        AI
                      </div>
                      <span class="text-xs text-neutral-500">AI Therapist</span>
                    </div>
                    <div v-html="formatMessage(message.content)"></div>
                    <div class="text-xs mt-1" :class="message.sender === 'user' ? 'text-primary-100' : 'text-neutral-500'">
                      {{ formatTime(message.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Typing indicator -->
              <div v-if="isTyping" class="flex justify-start mb-4">
                <div class="max-w-[80%] rounded-lg p-3 bg-neutral-100 text-neutral-800 rounded-tl-none">
                  <div class="flex items-center">
                    <div class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium text-xs mr-2">
                      AI
                    </div>
                    <div class="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Message input -->
          <div class="p-4 border-t border-neutral-200">
            <form @submit.prevent="sendMessage" class="flex items-center space-x-2">
              <textarea 
                v-model="newMessage" 
                placeholder="Type your message here..." 
                class="flex-grow p-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                :rows="1"
                @keydown.enter.prevent="sendMessage"
                :disabled="isTyping || loading"
                ref="messageInput"
              ></textarea>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="!newMessage.trim() || isTyping || loading"
              >
                <svg v-if="isTyping || loading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '../store/chat'
import { format } from 'date-fns'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

// Router and route
const route = useRoute()
const router = useRouter()

// Store
const chatStore = useChatStore()

// State
const newMessage = ref('')
const isTyping = ref(false)
const messagesContainer = ref(null)
const messageInput = ref(null)
const loading = ref(false)

// Computed properties
const conversationId = computed(() => route.params.id)

const conversations = computed(() => chatStore.conversationsList)

const currentConversation = computed(() => chatStore.currentConversation)

const messages = computed(() => chatStore.currentMessages)

// Methods
const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'MMM d, yyyy')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return format(new Date(timestamp), 'h:mm a')
}

const formatMessage = (content) => {
  // Convert markdown to HTML and sanitize
  return DOMPurify.sanitize(marked(content))
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const selectConversation = async (id) => {
  if (id === conversationId.value) return
  
  loading.value = true
  try {
    await chatStore.fetchConversation(id)
    router.push(`/chat/${id}`)
    await scrollToBottom()
  } catch (error) {
    console.error('Error fetching conversation:', error)
  } finally {
    loading.value = false
  }
}

const startNewConversation = () => {
  chatStore.clearMessagesListener()
  router.push('/chat')
  newMessage.value = ''
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isTyping.value) return
  
  const messageContent = newMessage.value
  newMessage.value = ''
  isTyping.value = true
  
  try {
    await chatStore.sendMessage(messageContent)
    await scrollToBottom()
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    isTyping.value = false
    await scrollToBottom()
    messageInput.value.focus()
  }
}

// Lifecycle hooks
onMounted(async () => {
  loading.value = true
  try {
    await chatStore.fetchConversations()
    
    if (conversationId.value) {
      await chatStore.fetchConversation(conversationId.value)
    }
    
    await scrollToBottom()
    messageInput.value.focus()
  } catch (error) {
    console.error('Error in chat initialization:', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  chatStore.clearMessagesListener()
})

// Watch for new messages to scroll to bottom
watch(messages, async () => {
  await scrollToBottom()
})
</script>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 1px;
  background-color: #9ca3af;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  } 40% { 
    transform: scale(1.0);
  }
}
</style>
