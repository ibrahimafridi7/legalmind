import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api'
})

api.interceptors.request.use((config) => {
  // Attach auth token here when integrated
  return config
})

export default api

