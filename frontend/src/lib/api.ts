import axios from 'axios'
import { toast } from 'sonner'
import { API_BASE_URL } from './config'
import { getAuthToken } from './auth'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000
})

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ERR_NETWORK' || err.message?.toLowerCase().includes('network')) {
      toast.error('Network error or timeout. Please check your connection and retry.')
    } else if (err.response?.status === 401) {
      toast.error('Unauthorized. Please sign in again.')
    }
    return Promise.reject(err)
  }
)

export default api

