import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import MobileShell from './MobileShell.jsx'
import MobileHome from './MobileHome.jsx'
import MobileRequests from './MobileRequests.jsx'
import MobileNewRequest from './MobileNewRequest.jsx'
import MobileRequestChat from './MobileRequestChat.jsx'
import MobileImportant from './MobileImportant.jsx'
import MobileManagerChat from './MobileManagerChat.jsx'
import MobileProfile from './MobileProfile.jsx'
import MobileNotifications from './MobileNotifications.jsx'
import './mobile.css'

export default function MobileClientApp({
  user, setUser, logout, page, onNavigate, requests, requestsLoading, currentRequestId,
  onOpenRequest, onSubmitRequest, onEvaluateRequest, onReloadRequests,
  notificationSummary, onNotificationRefresh, showToast,
}) {
  useEffect(() => {
    document.documentElement.classList.toggle('m-native', Capacitor.isNativePlatform())
    const viewport = window.visualViewport
    const updateViewport = () => {
      const height = viewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--m-viewport-height', `${height}px`)
      document.documentElement.classList.toggle('m-keyboard-open', Boolean(viewport && window.innerHeight - viewport.height > 140))
    }
    updateViewport()
    viewport?.addEventListener('resize', updateViewport)
    window.addEventListener('resize', updateViewport)
    return () => {
      viewport?.removeEventListener('resize', updateViewport)
      window.removeEventListener('resize', updateViewport)
      document.documentElement.classList.remove('m-keyboard-open')
      document.documentElement.classList.remove('m-native')
    }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined
    let backHandle
    let cancelled = false
    Promise.all([
      import('@capacitor/app'),
      import('@capacitor/keyboard'),
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ]).then(([appModule, keyboardModule, statusModule, splashModule]) => {
      if (cancelled) return
      const { App: NativeApp } = appModule
      keyboardModule.Keyboard.setResizeMode({ mode: keyboardModule.KeyboardResize.Native }).catch(() => {})
      statusModule.StatusBar.setStyle({ style: statusModule.Style.Dark }).catch(() => {})
      statusModule.StatusBar.setBackgroundColor({ color: '#F7F7FA' }).catch(() => {})
      statusModule.StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
      splashModule.SplashScreen.hide().catch(() => {})
      NativeApp.addListener('backButton', () => {
        if (['detail', 'new', 'notifs'].includes(page)) onNavigate('questions')
        else if (page === 'manager-chat') onNavigate('profile')
        else if (page !== 'dashboard') onNavigate('dashboard')
        else NativeApp.exitApp()
      }).then(handle => { backHandle = handle })
    }).catch(error => console.error('Native setup error:', error))
    return () => { cancelled = true; backHandle?.remove() }
  }, [onNavigate, page])

  const currentRequest = requests.find(request => request.id === currentRequestId)

  if (page === 'new') return <MobileNewRequest onBack={() => onNavigate('dashboard')} onSubmit={onSubmitRequest} />
  if (page === 'detail' && currentRequestId) return <MobileRequestChat requestId={currentRequestId} request={currentRequest} user={user} onBack={() => onNavigate('questions')} onEvaluate={onEvaluateRequest} onRefreshRequests={onReloadRequests} showToast={showToast} />
  if (page === 'manager-chat') return <MobileManagerChat user={user} onBack={() => onNavigate('profile')} showToast={showToast} />
  if (page === 'notifs') return <MobileNotifications requests={requests} onBack={() => onNavigate('dashboard')} onOpenRequest={onOpenRequest} onNavigate={onNavigate} onRefresh={onNotificationRefresh} />

  let content
  if (page === 'questions') content = <MobileRequests requests={requests} onOpen={onOpenRequest} onNew={() => onNavigate('new')} />
  else if (page === 'important') content = <MobileImportant onNavigate={onNavigate} showToast={showToast} />
  else if (page === 'profile') content = <MobileProfile user={user} onUpdateUser={setUser} onNavigate={onNavigate} onLogout={logout} showToast={showToast} />
  else content = <MobileHome user={user} requests={requests} loading={requestsLoading} onNew={() => onNavigate('new')} onOpen={onOpenRequest} onNavigate={onNavigate} />

  return <MobileShell page={page} user={user} notificationSummary={notificationSummary} onNavigate={onNavigate}>{content}</MobileShell>
}
