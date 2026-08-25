import endpoints from "../../endpoints.json"
import axios from "axios"
export const api = axios.create({
    baseURL: `${endpoints["local"]}/api/v1`,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
})