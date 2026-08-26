import endpoints from "../../endpoints.json"
import axios from "axios"
import { clearAccessToken, getAccessToken } from "../stores/auth"

export const API_ORIGIN = (import.meta.env.VITE_API_URL || endpoints.local).replace(/\/$/, '')

export const api = axios.create({
    baseURL: `${API_ORIGIN}/api/v1`,
    headers: {
        "Content-Type": "application/json"
    }
})

api.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) clearAccessToken()
        return Promise.reject(error)
    },
)
