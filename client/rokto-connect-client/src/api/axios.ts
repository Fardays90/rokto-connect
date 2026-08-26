import endpoints from "../../endpoints.json"
import axios from "axios"
import { getSessionToken } from "./session"

export const API_ORIGIN = (import.meta.env.VITE_API_URL || endpoints.local).replace(/\/$/, '')

export const api = axios.create({
    baseURL: `${API_ORIGIN}/api/v1`,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
})

// when there's no usable session cookie (e.g. deployed frontend talking to
// a localhost API), fall back to the stored token as a Bearer header
api.interceptors.request.use((config) => {
    const token = getSessionToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})
