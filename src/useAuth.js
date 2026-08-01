import { useState, useEffect, useCallback } from 'react'
import { authApi } from './api.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('prosto_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('prosto_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('prosto_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, password, inn, name) => {
    const data = await authApi.register(email, password, inn, name)
    localStorage.setItem('prosto_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('prosto_token')
    setUser(null)
  }, [])

  return { user, loading, login, register, logout }
}
