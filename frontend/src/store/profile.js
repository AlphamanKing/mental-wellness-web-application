import { defineStore } from 'pinia'
import { getAuth, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null,
    stats: null,
    loading: false,
    error: null
  }),
  
  getters: {
    userBio: (state) => state.profile?.bio || '',
    userPreferences: (state) => state.profile?.preferences || {},
    userStats: (state) => state.stats || {}
  },
  
  actions: {
    async fetchUserProfile() {
      this.loading = true
      this.error = null
      
      try {
        const auth = getAuth()
        const token = await auth.currentUser.getIdToken()
        
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch profile')
        }
        
        this.profile = await response.json()
        return this.profile
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async updateUserProfile(profileData) {
      this.loading = true
      this.error = null
      
      try {
        const auth = getAuth()
        const token = await auth.currentUser.getIdToken()
        
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileData)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update profile')
        }
        
        // Update local profile data
        this.profile = { ...this.profile, ...profileData }
        
        // Update Firebase Auth profile if display name is provided
        if (profileData.displayName) {
          await updateProfile(auth.currentUser, {
            displayName: profileData.displayName
          })
        }
        
        return await response.json()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async uploadProfileImage(file) {
      this.loading = true;
      this.error = null;
      
      try {
        const formData = new FormData();
        // Change to 'profileImage' to match backend expectation
        formData.append('profileImage', file);
        
        const auth = getAuth();
        const token = await auth.currentUser.getIdToken();
        
        const response = await fetch(`${API_BASE_URL}/api/user/profile/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type header for multipart/form-data
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload image');
        }

        const data = await response.json();
        
        // Make sure we have an image URL in the response
        if (!data.imageUrl) {
          throw new Error('No image URL in response');
        }

        const imageUrl = data.imageUrl;

        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, {
          photoURL: imageUrl
        });

        // Update local profile data
        if (this.profile) {
          this.profile.photoURL = imageUrl;
        }

        return imageUrl;
      } catch (error) {
        console.error('Profile image upload error:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchUserStats() {
      this.loading = true;
      this.error = null;

      try {
        const auth = getAuth();
        const token = await auth.currentUser.getIdToken();
        
        const response = await fetch(`${API_BASE_URL}/api/user/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }

        const data = await response.json();
        
        // Store the stats in the store
        this.stats = {
          conversationCount: parseInt(data.conversationCount) || 0,
          journalCount: parseInt(data.journalCount) || 0,
          moodCount: parseInt(data.moodCount) || 0,
          goalCount: parseInt(data.goalCount) || 0,
          completedGoalCount: parseInt(data.completedGoalCount) || 0,
          averageMood: parseFloat(data.averageMood) || null
        };

        return this.stats;
      } catch (error) {
        console.error('Error fetching stats:', error);
        this.error = error.message;
        // Return default stats object on error
        return {
          conversationCount: 0,
          journalCount: 0,
          moodCount: 0,
          goalCount: 0,
          completedGoalCount: 0,
          averageMood: null
        };
      } finally {
        this.loading = false;
      }
    }
  }
})
