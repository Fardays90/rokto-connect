import endpoints from "../../endpoints.json"
import axios from "axios"

export const API_ORIGIN = (import.meta.env.VITE_API_URL || endpoints.local).replace(/\/$/, '')

export const api = axios.create({
    baseURL: `${API_ORIGIN}/api/v1`,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
})
