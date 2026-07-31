import { useState } from 'react'
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
import { requests as initialRequests } from './data.js'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState('all')
  const [currentRequestId, setCurrentRequestId] = useState(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const goTo = (p) => {
    setPage(p)
    if (p === 'dashboard') setFilter('all')
  }

  const goToFiltered = (f) => {
    setPage('dashboard')
    setFilter(f)
  }

  const openDetail = (id) => {
    setCurrentRequestId(id)
    setPage('detail')
  }

  const submitRequest = (title, desc) => {
    const newReq = {
      id: Date.now(),
      title,
      status: 'open',
      level: 'l0',
      date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      desc: desc || 'Без описания',
    }
    setRequests([newReq, ...requests])
    goTo('dashboard')
    showToast('Обращение создано')
  }

  const updateRequest = (id, updates) => {
    setRequests(requests.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <Header onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} page={page} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onNavigate={goTo} onFiltered={goToFiltered} onOpenManager={() => setManagerOpen(true)} page={page} filter={filter} />
        <main className="flex-1 overflow-y-auto p-8 md:p-5 pb-20 md:pb-20" style={{ scrollBehavior: 'smooth' }}>
          <div className="max-w-[1060px] mx-auto">
            {page === 'dashboard' && (
              <Dashboard
                requests={requests}
                filter={filter}
                onFilterChange={setFilter}
                onOpenDetail={openDetail}
                onNavigate={goTo}
              />
            )}
            {page === 'new' && (
              <NewRequest onSubmit={submitRequest} onCancel={() => goTo('dashboard')} />
            )}
            {page === 'detail' && currentRequestId && (
              <ChatDetail
                request={requests.find(r => r.id === currentRequestId)}
                onBack={() => goTo('dashboard')}
                onOpenManager={() => setManagerOpen(true)}
                onUpdateRequest={updateRequest}
                onNavigate={goTo}
                showToast={showToast}
              />
            )}
            {page === 'important' && (
              <Important onNavigate={goTo} onOpenManager={() => setManagerOpen(true)} />
            )}
            {page === 'profile' && (
              <Profile onOpenManager={() => setManagerOpen(true)} showToast={showToast} />
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
