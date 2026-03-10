import axios from 'axios'
import { API_BASE_URL } from './config'
import { getAuthToken } from './auth'

const api = axios.create({
  baseURL: API_BASE_URL
})

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

