const tokenKey = 'webhook-dashboard-token'

export const getStoredToken = () => window.localStorage.getItem(tokenKey)

export const setStoredToken = (token: string) => {
    window.localStorage.setItem(tokenKey, token)
}

export const clearStoredToken = () => {
    window.localStorage.removeItem(tokenKey)
}