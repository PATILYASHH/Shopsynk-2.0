import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface ModeRestrictedRouteProps {
  children: React.ReactNode
  requiredMode: 'business' | 'personal'
  redirectTo?: string
}

const ModeRestrictedRoute: React.FC<ModeRestrictedRouteProps> = ({ 
  children, 
  requiredMode, 
  redirectTo = '/dashboard' 
}) => {
  const { user } = useAuth()
  const [userMode, setUserMode] = useState<'business' | 'personal' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserMode = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('mode')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          setUserMode(data.mode)
        } else {
          // Default to business mode if no preference found
          setUserMode('business')
        }
      } catch (error) {
        console.error('Error checking user mode:', error)
        setUserMode('business')
      } finally {
        setLoading(false)
      }
    }

    checkUserMode()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user mode doesn't match required mode, redirect
  if (userMode && userMode !== requiredMode) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default ModeRestrictedRoute
