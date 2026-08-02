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

    let active = true
    const loadingGuard = setTimeout(() => {
      if (active) setLoading(false)
    }, 8500)

    authApi.me()
      .then(data => {
        if (active) setUser(data.user)
      })
      .catch(error => {
        if (error.status === 401) localStorage.removeItem('prosto_token')
      })
      .finally(() => {
        clearTimeout(loadingGuard)
        if (active) setLoading(false)
      })

    return () => {
      active = false
      clearTimeout(loadingGuard)
    }
  }, [])

  const login = useCallback(async (email, password, onProgress) => {
    const data = await authApi.login(email.trim(), password, onProgress)
    localStorage.setItem('prosto_token', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, password, inn, name, onProgress) => {
    const data = await authApi.register(email.trim(), password, inn, name, onProgress)
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
