import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import axios from 'axios'

export const useGoalsStore = defineStore('goals', {
  state: () => ({
    goals: [],
    loading: false,
    error: null
  }),
  
  getters: {
    allGoals: (state) => state.goals,
    activeGoals: (state) => state.goals.filter(goal => !goal.completed),
    completedGoals: (state) => state.goals.filter(goal => goal.completed),
    isLoading: (state) => state.loading
  },
  
  actions: {
    async fetchGoals() {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        // Get auth token for API requests
        const token = await authStore.user.getIdToken()
        
        const response = await axios.get(
          '/api/goals',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        this.goals = response.data.map(goal => ({
          ...goal,
          target_date: goal.target_date ? goal.target_date : null,
          created_at: goal.created_at && goal.created_at._seconds ? 
            new Date(goal.created_at._seconds * 1000) : 
            (goal.created_at ? new Date(goal.created_at) : new Date()),
          updated_at: goal.updated_at && goal.updated_at._seconds ? 
            new Date(goal.updated_at._seconds * 1000) : 
            (goal.updated_at ? new Date(goal.updated_at) : new Date())
        }))
        
        return this.goals
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Add setGoals method to handle data passed from API
    setGoals(goalsData) {
      if (!goalsData || !Array.isArray(goalsData)) {
        console.warn('Invalid goals data received:', goalsData);
        return;
      }

      try {
        this.goals = goalsData.map(goal => {
          // Process dates safely
          let created_at = goal.created_at;
          let updated_at = goal.updated_at;
          let target_date = goal.target_date;
          
          // Handle Firestore timestamp objects
          if (created_at && typeof created_at === 'object' && created_at._seconds) {
            created_at = new Date(created_at._seconds * 1000);
          } else if (typeof created_at === 'string') {
            created_at = new Date(created_at);
          }
          
          if (updated_at && typeof updated_at === 'object' && updated_at._seconds) {
            updated_at = new Date(updated_at._seconds * 1000);
          } else if (typeof updated_at === 'string') {
            updated_at = new Date(updated_at);
          }
          
          if (target_date && typeof target_date === 'object' && target_date._seconds) {
            target_date = new Date(target_date._seconds * 1000);
          } else if (typeof target_date === 'string') {
            target_date = new Date(target_date);
          }
          
          return {
            ...goal,
            created_at,
            updated_at,
            target_date
          };
        });
      } catch (error) {
        console.error('Error processing goals data:', error);
      }
    },
    
    async createGoal(goalData) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        // Get auth token for API requests
        const token = await authStore.user.getIdToken()
        
        // Check if we received a goal data object or individual params
        let title, description, target_date, category;
        
        if (typeof goalData === 'object' && goalData !== null) {
          // Extract data from the object
          title = goalData.title;
          description = goalData.description || '';
          category = goalData.category || 'Other';
          target_date = goalData.due_date || goalData.target_date;
        } else {
          // Old format with individual params
          title = arguments[0];
          description = arguments[1] || '';
          target_date = arguments[2];
          category = arguments[3] || 'Other';
        }
        
        // Prepare data for API
        const data = {
          title,
          description,
          category,
          target_date: target_date instanceof Date ? target_date.toISOString() : target_date
        };
        
        console.log("Sending goal data to API:", data);
        
        const response = await axios.post(
          '/api/goals',
          data,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        // Refresh goals
        await this.fetchGoals()
        
        return response.data
      } catch (error) {
        this.error = error.message
        console.error("Error creating goal:", error);
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async updateGoal(goalId, updates) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.userId
        
        if (!userId) {
          throw new Error('User not authenticated')
        }
        
        // Get auth token for API requests
        const token = await authStore.user.getIdToken()
        
        // Format target_date if it exists
        if (updates.target_date) {
          if (updates.target_date instanceof Date) {
            updates.target_date = updates.target_date.toISOString().split('T')[0];
          } else if (typeof updates.target_date === 'string') {
            // Make sure it's a valid date string
            try {
              const date = new Date(updates.target_date);
              if (!isNaN(date.getTime())) {
                updates.target_date = date.toISOString().split('T')[0];
              }
            } catch (error) {
              console.warn('Invalid date string:', updates.target_date);
            }
          }
        }
        
        // Ensure we're sending a simple object without methods or complex properties
        const cleanUpdates = {};
        
        // Only include valid primitive properties
        for (const key in updates) {
          if (
            updates.hasOwnProperty(key) && 
            (typeof updates[key] === 'string' || 
             typeof updates[key] === 'number' || 
             typeof updates[key] === 'boolean' ||
             updates[key] === null)
          ) {
            cleanUpdates[key] = updates[key];
          }
        }
        
        console.log("Sending updates to API:", cleanUpdates);
        
        const response = await axios.put(
          `/api/goal/${goalId}`,
          cleanUpdates,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        // Refresh goals
        await this.fetchGoals()
        
        return response.data
      } catch (error) {
        this.error = error.message
        console.error("Error updating goal:", error, updates);
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async toggleGoalCompletion(goalId) {
      try {
        // First find the goal to get its current completion status
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) {
          throw new Error(`Goal with ID ${goalId} not found`);
        }
        
        // Toggle the completion status - just send a simple boolean value
        const completed = !goal.completed;
        
        return this.updateGoal(goalId, { completed });
      } catch (error) {
        console.error("Error in toggleGoalCompletion:", error);
        throw error;
      }
    }
  }
})
