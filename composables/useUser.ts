import { ref } from 'vue'
import type { User, CreateUserInput, UpdateUserInput } from '~/types/user'

export const useUser = () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref('')

  // Get all users
  const fetchUsers = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch('/api/users')
      users.value = response.data
      return { success: true, data: response.data }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch users'
      console.error('Error fetching users:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Create user
  const createUser = async (input: CreateUserInput) => {
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch('/api/users', {
        method: 'POST',
        body: input,
      })
      users.value.push(response.data)
      return { success: true, data: response.data }
    } catch (err: any) {
      error.value = err.message || 'Failed to create user'
      console.error('Error creating user:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Update user
  const updateUser = async (uid: string, input: UpdateUserInput) => {
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch(`/api/users/${uid}`, {
        method: 'PUT',
        body: input,
      })
      const index = users.value.findIndex(u => u.uid === uid)
      if (index > -1) {
        users.value[index] = response.data
      }
      return { success: true, data: response.data }
    } catch (err: any) {
      error.value = err.message || 'Failed to update user'
      console.error('Error updating user:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Delete user
  const deleteUser = async (uid: string) => {
    loading.value = true
    error.value = ''
    try {
      await $fetch(`/api/users/${uid}`, {
        method: 'DELETE',
      })
      users.value = users.value.filter(u => u.uid !== uid)
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete user'
      console.error('Error deleting user:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}
