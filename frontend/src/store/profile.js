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
      
      return new Promise((resolve, reject) => {
        try {
          console.log("Starting profile image upload");
          
          // Validate file
          if (!file || !file.type.startsWith('image/')) {
            this.loading = false;
            reject(new Error('Please select a valid image file'));
            return;
          }
          
          // Check file size (max 2MB)
          if (file.size > 2 * 1024 * 1024) {
            this.loading = false;
            reject(new Error('Image size should be less than 2MB'));
            return;
          }
          
          // Read the file as a data URL (base64)
          const reader = new FileReader();
          
          reader.onload = async (e) => {
            try {
              const base64Image = e.target.result;
              console.log("Image read successfully, length:", base64Image.length);
              
              // Update profile image in Firebase Auth
              await updateProfile(auth.currentUser, {
                photoURL: base64Image
              });
              
              // Update profile image in Firestore
              await setDoc(doc(db, 'users', auth.currentUser.uid), {
                photoURL: base64Image
              }, { merge: true });
              
              // Update local profile data
              if (this.profile) {
                this.profile.photoURL = base64Image;
              }
              
              console.log("Profile image updated successfully");
              this.loading = false;
              resolve(base64Image);
            } catch (error) {
              console.error('Error updating profile with base64 image:', error);
              this.error = error.message;
              this.loading = false;
              reject(error);
            }
          };
          
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            this.error = 'Failed to read the image file';
            this.loading = false;
            reject(new Error('Failed to read the image file'));
          };
          
          // Start reading the file
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Profile image upload error:', error);
          this.error = error.message;
          this.loading = false;
          reject(error);
        }
      });
    },
    
    async fetchUserStats() {
      this.loading = true
      this.error = null
      
      try {
        const auth = getAuth()
        const token = await auth.currentUser.getIdToken()
        
        const response = await fetch(`${API_BASE_URL}/api/user/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch user stats')
        }
        
        this.stats = await response.json()
        return this.stats
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
