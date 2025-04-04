<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-indigo-700 mb-8">Your Profile</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <!-- Profile Information -->
      <div class="flex flex-col md:flex-row items-start gap-8">
        <!-- Profile Image -->
        <div class="w-full md:w-1/3 flex flex-col items-center">
          <div class="relative mb-4">
            <img 
              :src="profileImage" 
              alt="Profile" 
              class="w-40 h-40 rounded-full object-cover border-4 border-indigo-100"
            />
            <button 
              @click="triggerFileInput" 
              class="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"
              title="Change profile picture"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleImageChange" 
              accept="image/*" 
              class="hidden"
            />
          </div>
          <h2 class="text-xl font-semibold text-gray-800">{{ displayName }}</h2>
          <p class="text-gray-600">{{ email }}</p>
        </div>

        <!-- Profile Details Form -->
        <div class="w-full md:w-2/3">
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                id="displayName"
                v-model="form.displayName"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
              <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                id="bio"
                v-model="form.bio"
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tell us a bit about yourself"
              ></textarea>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                :disabled="isUpdating"
              >
                <span v-if="isUpdating">Updating...</span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- User Statistics -->
    <div v-if="stats" class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Your Activity</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-indigo-50 p-4 rounded-lg">
          <p class="text-sm text-indigo-600 font-medium">Conversations</p>
          <p class="text-2xl font-bold text-indigo-800">{{ stats.conversationCount || 0 }}</p>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <p class="text-sm text-green-600 font-medium">Journal Entries</p>
          <p class="text-2xl font-bold text-green-800">{{ stats.journalCount || 0 }}</p>
        </div>
        
        <div class="bg-yellow-50 p-4 rounded-lg">
          <p class="text-sm text-yellow-600 font-medium">Mood Entries</p>
          <p class="text-2xl font-bold text-yellow-800">{{ stats.moodCount || 0 }}</p>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-lg">
          <p class="text-sm text-blue-600 font-medium">Goals</p>
          <p class="text-2xl font-bold text-blue-800">{{ stats.goalCount || 0 }}</p>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <p class="text-sm text-purple-600 font-medium">Completed Goals</p>
          <p class="text-2xl font-bold text-purple-800">{{ stats.completedGoalCount || 0 }}</p>
        </div>
        
        <div v-if="stats.averageMood !== null" class="bg-pink-50 p-4 rounded-lg">
          <p class="text-sm text-pink-600 font-medium">Average Mood</p>
          <p class="text-2xl font-bold text-pink-800">{{ stats.averageMood.toFixed(1) }}/10</p>
        </div>
      </div>
    </div>

    <!-- Account Settings -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
      
      <div class="space-y-4">
        <div>
          <button 
            @click="showPasswordModal = true" 
            class="text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none transition"
          >
            Change Password
          </button>
        </div>
        
        <div>
          <button 
            @click="confirmDeleteAccount" 
            class="text-red-600 hover:text-red-800 font-medium focus:outline-none transition"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>

    <!-- Password Change Modal -->
    <div v-if="showPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
        
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm new password"
            />
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="showPasswordModal = false"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              :disabled="passwordLoading"
            >
              <span v-if="passwordLoading">Updating...</span>
              <span v-else>Change Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold text-red-600 mb-4">Delete Account</h3>
        <p class="text-gray-700 mb-6">
          Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
        </p>
        
        <div class="flex justify-end space-x-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
          >
            Cancel
          </button>
          <button
            @click="deleteAccount"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            :disabled="deleteLoading"
          >
            <span v-if="deleteLoading">Deleting...</span>
            <span v-else>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth'
import { useProfileStore } from '../store/profile'
import { useAuthStore } from '../store/auth'
import { useNotificationStore } from '../store/notification'
import DefaultProfileImage from '../assets/images/default-profile.png'
import { auth } from '../firebase'
import apiClient from '../utils/apiClient'
import { useLoadingState } from '../utils/useLoadingState'

// Store instances
const profileStore = useProfileStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Loading state manager
const { executeWithLoading, isLoading } = useLoadingState({
  timeout: 20000,  // 20 second timeout for uploads
  maxRetries: 1    // Only retry once
})

// State
const profileData = ref(null)
const initialData = ref({
  displayName: '',
  email: '',
  bio: ''
})
const stats = ref(null)
const loading = ref(true)
const isUpdating = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)
const fileInput = ref(null)
const passwordLoading = ref(false)
const deleteLoading = ref(false)

// Form data
const form = ref({
  displayName: '',
  email: '',
  bio: ''
})

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed properties
const displayName = computed(() => form.value.displayName || 'User')
const email = computed(() => form.value.email || '')
const profileImage = computed(() => profileData.value?.photoURL || DefaultProfileImage)

// Show notification
const showNotification = (message, type = 'success') => {
  notificationStore.showNotification({
    message,
    type
  })
}

// Fetch user profile data
const fetchProfile = async () => {
  loading.value = true
  
  try {
    // Fetch profile and stats in parallel
    await Promise.allSettled([
      executeWithLoading('profile', async () => {
        profileData.value = await profileStore.fetchUserProfile()
        
        // Set initial form data
        form.value = {
          displayName: profileData.value.displayName || '',
          email: profileData.value.email || '',
          bio: profileData.value.bio || ''
        }
        
        // Save initial data for comparison
        initialData.value = { ...form.value }
      }),
      
      executeWithLoading('stats', async () => {
        try {
          stats.value = await profileStore.fetchUserStats()
        } catch (error) {
          console.error('Error fetching stats:', error)
        }
      })
    ]);
  } catch (error) {
    console.error('Error fetching profile:', error)
    showNotification('Failed to load profile', 'error')
  } finally {
    loading.value = false
  }
}

// Trigger file input click
const triggerFileInput = () => {
  fileInput.value.click()
}

// Handle profile image change
const handleImageChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Check file type and size
  if (!file.type.startsWith('image/')) {
    showNotification('Please select an image file', 'error');
    return;
  }
  
  if (file.size > 2 * 1024 * 1024) { // 2MB limit
    showNotification('Image size should be less than 2MB', 'error');
    return;
  }
  
  try {
    showNotification('Uploading profile picture...', 'info');
    
    const downloadURL = await profileStore.uploadProfileImage(file);
    
    // Update local state
    if (profileData.value) {
      profileData.value.photoURL = downloadURL;
    }
    
    // Force UI update
    document.dispatchEvent(new CustomEvent('user-profile-updated', {
      detail: {
        displayName: displayName.value,
        photoURL: downloadURL
      }
    }));
    
    showNotification('Profile picture updated successfully', 'success');
  } catch (error) {
    console.error('Error updating profile picture:', error);
    showNotification(error.message || 'Failed to update profile picture', 'error');
  } finally {
    // Clear the file input
    if (event.target) {
      event.target.value = null;
    }
  }
}

// Update profile
const updateProfile = async () => {
  if (!form.value.displayName.trim()) {
    showNotification('Display name cannot be empty', 'error')
    return
  }
  
  try {
    isUpdating.value = true
    
    // Only update if something has changed
    if (
      (form.value.displayName !== initialData.value.displayName || 
       form.value.bio !== initialData.value.bio)
    ) {
      // Update profile using the store
      await profileStore.updateUserProfile({
        displayName: form.value.displayName,
        bio: form.value.bio
      })
      
      // Update auth store with fresh user data
      authStore.setUser({
        ...auth.currentUser,
        displayName: form.value.displayName
      })
      
      // Update initial data to match current form data
      initialData.value = { ...form.value }
      
      // Update local state
      if (profileData.value) {
        profileData.value.displayName = form.value.displayName
        profileData.value.bio = form.value.bio
      }
      
      showNotification('Profile updated successfully')
      
      // Force UI update in any components that use the user's display name
      document.dispatchEvent(new CustomEvent('user-profile-updated', {
        detail: {
          displayName: form.value.displayName,
          photoURL: profileImage.value
        }
      }))
    } else {
      // No changes made
      showNotification('No changes to save')
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    showNotification('Failed to update profile', 'error')
  } finally {
    isUpdating.value = false
  }
}

// Change password
const changePassword = async () => {
  // Validate passwords
  if (!passwordForm.value.currentPassword) {
    showNotification('Current password is required', 'error')
    return
  }
  
  if (!passwordForm.value.newPassword) {
    showNotification('New password is required', 'error')
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showNotification('New passwords do not match', 'error')
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    showNotification('Password must be at least 6 characters', 'error')
    return
  }
  
  try {
    passwordLoading.value = true
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      passwordForm.value.currentPassword
    )
    
    await reauthenticateWithCredential(auth.currentUser, credential)
    
    // Update password
    await updatePassword(auth.currentUser, passwordForm.value.newPassword)
    
    // Reset form and close modal
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    showPasswordModal.value = false
    showNotification('Password changed successfully')
  } catch (error) {
    console.error('Error changing password:', error)
    
    if (error.code === 'auth/wrong-password') {
      showNotification('Current password is incorrect', 'error')
    } else {
      showNotification('Failed to change password', 'error')
    }
  } finally {
    passwordLoading.value = false
  }
}

// Confirm delete account
const confirmDeleteAccount = () => {
  showDeleteModal.value = true
}

// Delete account
const deleteAccount = async () => {
  try {
    deleteLoading.value = true
    
    // Delete user from Firebase Auth
    await deleteUser(auth.currentUser)
    
    // User will be automatically logged out and redirected to login page
    showNotification('Account deleted successfully')
  } catch (error) {
    console.error('Error deleting account:', error)
    
    if (error.code === 'auth/requires-recent-login') {
      showNotification('Please log out and log back in to delete your account', 'error')
    } else {
      showNotification('Failed to delete account', 'error')
    }
    
    showDeleteModal.value = false
  } finally {
    deleteLoading.value = false
  }
}

// Fetch user profile data on mount
onMounted(async () => {
  await fetchProfile()
})
</script>
