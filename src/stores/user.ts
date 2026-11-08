import { defineStore } from 'pinia'
import { ref } from 'vue'

const ACCESS_TOKEN_KEY = 'accessToken'

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY) ?? '')

  function setAccessToken(value: string) {
    accessToken.value = value
    localStorage.setItem(ACCESS_TOKEN_KEY, value)
  }

  function logout() {
    accessToken.value = ''
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }

  return { accessToken, setAccessToken, logout }
})
