import { defineStore } from 'pinia'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    userDisplayName: (state) => state.user?.displayName || 'User',
    userEmail: (state) => state.user?.email || '',
    userPhotoURL: (state) => state.user?.photoURL || '',
    userId: (state) => state.user?.uid || null
  },
  
  actions: {
    async registerUser(email, password, displayName) {
      this.loading = true
      this.error = null
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Update user profile with display name
        await updateProfile(userCredential.user, {
          displayName: displayName
        })
        
        this.user = userCredential.user
        return userCredential.user
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async loginUser(email, password) {
      this.loading = true
      this.error = null
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        this.user = userCredential.user
        return userCredential.user
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async loginWithGoogle() {
      this.loading = true
      this.error = null
      
      try {
        const userCredential = await signInWithPopup(auth, googleProvider)
        this.user = userCredential.user
        return userCredential.user
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async logoutUser() {
      this.loading = true
      this.error = null
      
      try {
        await signOut(auth)
        this.user = null
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async resetPassword(email) {
      this.loading = true
      this.error = null
      
      try {
        await sendPasswordResetEmail(auth, email)
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    setUser(user) {
      this.user = user
    }
  }
})
