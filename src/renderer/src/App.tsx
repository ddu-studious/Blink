import { useEffect, useState } from 'react'
import RestPage from './pages/Rest/RestPage'
import SettingsPage from './pages/Settings/SettingsPage'
import DashboardPage from './pages/Dashboard/DashboardPage'

type RestScreenMode = 'classic' | 'nature' | 'breathing' | 'eyeTraining' | 'darkScreen' | 'stretch' | 'mindful'

/**
 * 路由解析: 从 hash 中获取当前页面路径和参数
 * 格式: #/rest?breakType=mini&duration=20&isPrimary=true
 */
function useHashRoute() {
  const [route, setRoute] = useState({ path: '/', params: new URLSearchParams() })

  useEffect(() => {
    function parseHash() {
      const hash = window.location.hash.slice(1) || '/'
      const [path, queryString] = hash.split('?')
      const params = new URLSearchParams(queryString || '')
      setRoute({ path, params })
    }

    parseHash()
    window.addEventListener('hashchange', parseHash)
    return () => window.removeEventListener('hashchange', parseHash)
  }, [])

  return route
}

function App() {
  const { path, params } = useHashRoute()

  switch (path) {
    case '/rest':
      return (
        <RestPage
          breakType={(params.get('breakType') as 'mini' | 'long') || 'mini'}
          duration={parseInt(params.get('duration') || '20', 10)}
          isPrimary={params.get('isPrimary') === 'true'}
          forceMode={params.get('forceMode') as RestScreenMode | null}
        />
      )
    case '/settings':
      return <SettingsPage />
    case '/dashboard':
      return <DashboardPage />
    default:
      return <SettingsPage />
  }
}

export default App
