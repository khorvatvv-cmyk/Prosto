import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth.js'
import { notificationsApi, requestsApi } from './api.js'
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
import { PointerGlowArea } from './components/ui/AceternityEffects.jsx'
import { ALLOWED_PAGES_BY_ROLE, STAFF_ROLES, homePageForRole } from './access.js'

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
  const [notificationSummary, setNotificationSummary] = useState({ messages: 0, campaigns: 0, total: 0 })
  const previousNotifications = useRef(null)
  const userId = user?.id
  const userRole = user?.role

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const applyNotificationSummary = useCallback((data, announce = false) => {
    const next = {
      messages: Number(data?.unread_messages || 0),
      campaigns: Number(data?.unread_campaigns || 0),
      total: Number(data?.unread_count || 0),
    }
    const previous = previousNotifications.current
    if (announce && previous && next.messages > previous.messages) showToast('Новое сообщение от менеджера')
    if (announce && previous && next.campaigns > previous.campaigns) showToast('В разделе «Важное» появилась новая акция')
    previousNotifications.current = next
    setNotificationSummary(next)
  }, [showToast])

  const loadNotificationSummary = useCallback(async (announce = false) => {
    if (userRole !== 'user') return
    try {
      const data = await notificationsApi.list()
      applyNotificationSummary(data, announce)
    } catch (error) {
      console.error('Notification summary error:', error)
    }
  }, [userRole, applyNotificationSummary])

  const handleNotificationRefresh = useCallback((data) => {
    if (data) applyNotificationSummary(data)
    else loadNotificationSummary(false)
  }, [applyNotificationSummary, loadNotificationSummary])

  const loadRequests = useCallback(async () => {
    try {
      const data = await requestsApi.list()
      setRequests(data.requests || [])
    } catch (e) {
      console.error('Load requests error:', e)
    }
  }, [])

  useEffect(() => {
    if (userId && (userRole === 'user' || userRole === 'admin')) loadRequests()
  }, [userId, userRole, loadRequests])

  useEffect(() => {
    if (!userRole) return
    setPage(homePageForRole(userRole))
  }, [userRole])

  useEffect(() => {
    if (userRole !== 'user') {
      previousNotifications.current = null
      setNotificationSummary({ messages: 0, campaigns: 0, total: 0 })
      return
    }
    loadNotificationSummary(false)
    const timer = setInterval(() => loadNotificationSummary(true), 10000)
    return () => clearInterval(timer)
  }, [userRole, loadNotificationSummary])

  const goTo = (p) => {
    const allowedPages = ALLOWED_PAGES_BY_ROLE[userRole] || ALLOWED_PAGES_BY_ROLE.user
    if (!allowedPages.has(p)) {
      setPage(homePageForRole(userRole))
      return
    }
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
  const isStaff = STAFF_ROLES.includes(user.role)

  const renderCurrentPage = () => {
    if (page === 'dashboard' && (user.role === 'user' || user.role === 'admin')) {
      return (
        <Dashboard
          requests={requests}
          filter={filter}
          onFilterChange={setFilter}
          onOpenDetail={openDetail}
          onNavigate={goTo}
          user={user}
        />
      )
    }
    if (page === 'new' && (user.role === 'user' || user.role === 'admin')) {
      return <NewRequest onSubmit={submitRequest} onCancel={() => goTo('dashboard')} />
    }
    if (page === 'detail' && currentRequestId && (user.role === 'user' || user.role === 'admin')) {
      return (
        <ChatDetail
          request={currentRequest}
          onBack={() => goTo('dashboard')}
          onOpenManager={() => goTo('manager-chat')}
          onEvaluate={evaluateRequest}
          onNavigate={goTo}
          showToast={showToast}
        />
      )
    }
    if (page === 'important' && (user.role === 'user' || user.role === 'admin')) {
      return <Important showToast={showToast} onNavigate={goTo} />
    }
    if (page === 'manager-chat' && (user.role === 'user' || user.role === 'admin')) {
      return <ClientManagerChat user={user} showToast={showToast} />
    }
    if (page === 'notifs' && (user.role === 'user' || user.role === 'admin')) {
      return <Notifications requests={requests} onOpenDetail={openDetail} onNavigate={goTo} onRefresh={handleNotificationRefresh} />
    }
    if (page === 'profile') {
      return <Profile user={user} onOpenManager={() => goTo('manager-chat')} onLogout={logout} onUpdateUser={setUser} />
    }
    if (page === 'admin' && user.role === 'admin') {
      return <AdminPanel user={user} onNavigate={goTo} />
    }
    if (page === 'specialist' && (user.role === 'specialist' || user.role === 'admin')) {
      return <SpecialistPanel user={user} showToast={showToast} />
    }
    if (page === 'manager' && (user.role === 'manager' || user.role === 'rof' || user.role === 'admin')) {
      return <ManagerPanel user={user} showToast={showToast} />
    }
    if (page === 'rof' && (user.role === 'rof' || user.role === 'admin')) {
      return <RofPanel user={user} showToast={showToast} />
    }

    return (
      <div style={{ maxWidth: 560, margin: '64px auto', padding: 28, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 12, textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--color-ink)' }}>Раздел не удалось открыть</h2>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--color-ink-muted)' }}>Вернитесь на главное рабочее место и повторите переход.</p>
        <button onClick={() => goTo(homePageForRole(user.role))} style={{ height: 40, padding: '0 18px', border: 'none', borderRadius: 8, background: 'var(--color-accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          Вернуться
        </button>
      </div>
    )
  }

  const currentPageContent = renderCurrentPage()

  if (isStaff) {
    return (
      <div className="h-screen flex flex-col bg-[var(--color-bg)]">
        <Header onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} user={user} notificationSummary={notificationSummary} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-8 pb-20" style={{ scrollBehavior: 'smooth' }}>
          <PointerGlowArea className="max-w-[1200px] mx-auto">
            {currentPageContent}
          </PointerGlowArea>
        </main>
        <MobileTabbar onNavigate={goTo} page={page} user={user} notificationSummary={notificationSummary} />
        {toast && <Toast message={toast} />}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <Header onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} user={user} notificationSummary={notificationSummary} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} onLogout={logout} user={user} notificationSummary={notificationSummary} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-8 pb-20" style={{ scrollBehavior: 'smooth' }}>
          <PointerGlowArea className="max-w-[1060px] mx-auto">
            {currentPageContent}
          </PointerGlowArea>
        </main>
      </div>
      <MobileTabbar onNavigate={goTo} page={page} user={user} notificationSummary={notificationSummary} />
      {managerOpen && <ManagerModal onClose={() => setManagerOpen(false)} onSend={messageManager} />}
      {toast && <Toast message={toast} />}
    </div>
  )
}
