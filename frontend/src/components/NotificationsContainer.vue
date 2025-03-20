<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
    <NotificationToast 
      v-for="notification in notifications"
      :key="notification.id"
      :notification="notification"
      @close="onClose(notification.id)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '../store/notification'
import NotificationToast from './NotificationToast.vue'

const notificationStore = useNotificationStore()

const notifications = computed(() => {
  return notificationStore.notifications
})

const onClose = (id) => {
  notificationStore.hideNotification(id)
}
</script> 