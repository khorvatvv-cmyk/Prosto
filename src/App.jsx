import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth.js'
import { requestsApi } from './api.js'
import LoginScreen from './components/LoginScreen.jsx'
import Dashboard from './components/Dashboard.jsx'
import NewRequest from './components/NewRequest.jsx'
import ChatDetail from './components/ChatDetail.jsx'
import Important from './components/Important.jsx'
import Profile from './components/Profile.jsx'
import Notifications from './components/Notifications.jsx'
import ManagerModal from './components/ManagerModal.jsx'
import ClientManagerChat from './components/ClientManagerChat.jsx'
import Toast from './components/Toast.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import MobileTabbar from './components/MobileTabbar.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import OnboardingProfile from './components/OnboardingProfile.jsx'
import SpecialistPanel from './components/SpecialistPanel.jsx'
import ManagerPanel from './components/ManagerPanel.jsx'
import RofPanel from './components/RofPanel.jsx'

export default function App() {
  const { user, setUser, loading, login, register: rawRegister, logout } = useAuth()
  const register = useCallback(async (email, password, inn, name, onProgress) => {
    const u = await rawRegister(email, password, inn, name, onProgress)
    setShowOnboarding(true)
    return u
  }, [rawRegister])
  const [page, setPage] = useState('dashboard')
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [currentRequestId, setCurrentRequestId] = useState(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Загрузка вопросов с сервера
  const loadRequests = async () => {
    try {
      const data = await requestsApi.list()
      setRequests(data.requests || [])
    } catch (e) {
      console.error('Load requests error:', e)
    }
  }

  useEffect(() => {
    if (user) loadRequests()
  }, [user])

  useEffect(() => {
    if (!user) return
    const r = user.role
    if (r === 'rof') setPage('rof')
    else if (r === 'manager') setPage('manager')
    else if (r === 'specialist') setPage('specialist')
    else setPage('dashboard')
  }, [user?.role])

  const goTo = (p) => {
    setPage(p)
    if (p === 'dashboard') {
      setFilter('all')
      loadRequests()
    }
  }

  const openDetail = async (id) => {
    setCurrentRequestId(id)
    setPage('detail')
  }

  const submitRequest = async (title, desc) => {
    try {
      const data = await requestsApi.create(title, desc)
      setRequests(prev => [data.request, ...prev.filter(item => item.id !== data.request.id)])
      setCurrentRequestId(data.request.id)
      setPage('detail')
      showToast('Вопрос получили. Ищем решение…')
      return true
    } catch (e) {
      showToast('Ошибка: ' + e.message)
      return false
    }
  }

  const messageManager = async (text) => {
    await requestsApi.messageManager(text)
    await loadRequests()
    showToast('Сообщение передано команде сопровождения')
  }

  const evaluateRequest = async (id, helped) => {
    try {
      await requestsApi.evaluate(id, helped)
      await loadRequests()
      if (helped) showToast('Вопрос решён')
      else showToast('Подключаем специалиста…')
    } catch (e) {
      showToast('Ошибка: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ fontSize: 14, color: 'var(--color-ink-muted)' }}>Загрузка…</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} />
  }

  if (showOnboarding) {
    return <OnboardingProfile user={user} onComplete={() => setShowOnboarding(false)} />
  }

  const currentRequest = requests.find(r => r.id === currentRequestId)

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <Header onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} user={user} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} onLogout={logout} user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-8 pb-20" style={{ scrollBehavior: 'smooth' }}>
          <div className="max-w-[1060px] mx-auto">
            {page === 'dashboard' && (
              <Dashboard
                requests={requests}
                filter={filter}
                onFilterChange={setFilter}
                onOpenDetail={openDetail}
                onNavigate={goTo}
                user={user}
              />
            )}
            {page === 'new' && (
              <NewRequest onSubmit={submitRequest} onCancel={() => goTo('dashboard')} />
            )}
            {page === 'detail' && currentRequestId && (
              <ChatDetail
                request={currentRequest}
                onBack={() => goTo('dashboard')}
                onOpenManager={() => setManagerOpen(true)}
                onEvaluate={evaluateRequest}
                onNavigate={goTo}
                showToast={showToast}
              />
            )}
            {page === 'important' && (
              <Important showToast={showToast} onNavigate={goTo} />
            )}
            {page === 'manager-chat' && user?.role === 'user' && (
              <ClientManagerChat user={user} showToast={showToast} />
            )}
            {page === 'profile' && (
              <Profile user={user} onOpenManager={() => setManagerOpen(true)} onLogout={logout} onUpdateUser={setUser} />
            )}
            {page === 'notifs' && (
              <Notifications requests={requests} onOpenDetail={openDetail} />
            )}
            {page === 'admin' && user?.role === 'admin' && (
              <AdminPanel user={user} />
            )}
            {page === 'specialist' && (user?.role === 'specialist' || user?.role === 'admin') && (
              <SpecialistPanel user={user} showToast={showToast} />
            )}
            {page === 'manager' && (user?.role === 'manager' || user?.role === 'rof' || user?.role === 'admin') && (
              <ManagerPanel user={user} showToast={showToast} />
            )}
            {page === 'rof' && (user?.role === 'rof' || user?.role === 'admin') && (
              <RofPanel user={user} showToast={showToast} />
            )}
          </div>
        </main>
      </div>
      <MobileTabbar onNavigate={goTo} page={page} user={user} />
      {managerOpen && user?.role !== 'user' && <ManagerModal onClose={() => setManagerOpen(false)} onSend={messageManager} />}
      {toast && <Toast message={toast} />}
    </div>
  )
}
