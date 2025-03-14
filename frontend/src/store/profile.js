import { defineStore } from 'pinia'
import { getAuth, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

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
      this.loading = true
      this.error = null
      
      try {
        const auth = getAuth()
        const storage = getStorage()
        const db = getFirestore()
        
        // Upload image to Firebase Storage
        const imageRef = storageRef(storage, `profile_images/${auth.currentUser.uid}/${Date.now()}_${file.name}`)
        await uploadBytes(imageRef, file)
        
        // Get download URL
        const downloadURL = await getDownloadURL(imageRef)
        
        // Update profile image in Firebase Auth
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL
        })
        
        // Update profile image in Firestore
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          photoURL: downloadURL
        }, { merge: true })
        
        // Update local profile data
        if (this.profile) {
          this.profile.photoURL = downloadURL
        }
        
        return downloadURL
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
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
