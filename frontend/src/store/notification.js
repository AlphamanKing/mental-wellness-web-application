import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    defaultDuration: 3000 // 3 seconds
  }),
  
  getters: {
    notification: (state) => state.notifications[state.notifications.length - 1] || { show: false }
  },
  
  actions: {
    showNotification({ message, type = 'success', duration = null }) {
      // Create notification object
      const notification = {
        id: Date.now(),
        message,
        type,
        show: true
      }
      
      // Add to notifications list
      this.notifications.push(notification)
      
      // Auto-hide after duration
      setTimeout(() => {
        this.hideNotification(notification.id)
      }, duration || this.defaultDuration)
    },
    
    hideNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notifications[index].show = false
        
        // Remove from array after animation completes
        setTimeout(() => {
          this.notifications = this.notifications.filter(n => n.id !== id)
        }, 300)
      }
    },
    
    clearAllNotifications() {
      this.notifications = []
    }
  }
}) 