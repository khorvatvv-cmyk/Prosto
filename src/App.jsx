import { useState, useEffect } from 'react'
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
import Toast from './components/Toast.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import MobileTabbar from './components/MobileTabbar.jsx'

export default function App() {
  const { user, loading, login, register, logout } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [currentRequestId, setCurrentRequestId] = useState(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const [toast, setToast] = useState(null)

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

  const goTo = (p) => {
    setPage(p)
    if (p === 'dashboard') {
      setFilter('all')
      loadRequests()
    }
  }

  const goToFiltered = (f) => {
    setPage('dashboard')
    setFilter(f)
    loadRequests()
  }

  const openDetail = async (id) => {
    setCurrentRequestId(id)
    setPage('detail')
  }

  const submitRequest = async (title, desc) => {
    try {
      await requestsApi.create(title, desc)
      await loadRequests()
      goTo('dashboard')
      showToast('Вопрос получили. Ищем решение…')
    } catch (e) {
      showToast('Ошибка: ' + e.message)
    }
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

  const currentRequest = requests.find(r => r.id === currentRequestId)

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <Header onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} user={user} onLogout={logout} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} />
        <main className="flex-1 overflow-y-auto p-8 md:p-5 pb-20 md:pb-20" style={{ scrollBehavior: 'smooth' }}>
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
              <Important onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} />
            )}
            {page === 'profile' && (
              <Profile user={user} onOpenManager={() => setManagerOpen(true)} showToast={showToast} onLogout={logout} />
            )}
            {page === 'notifs' && (
              <Notifications onNavigate={goTo} />
            )}
          </div>
        </main>
      </div>
      <MobileTabbar onNavigate={goTo} page={page} />
      {managerOpen && <ManagerModal onClose={() => setManagerOpen(false)} showToast={showToast} />}
      {toast && <Toast message={toast} />}
    </div>
  )
}
