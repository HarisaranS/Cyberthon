import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ds_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      const refresh = localStorage.getItem('ds_refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`, { refreshToken: refresh })
          localStorage.setItem('ds_access_token', data.data.accessToken)
          err.config.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(err.config)
        } catch {
          localStorage.removeItem('ds_access_token')
          localStorage.removeItem('ds_refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
