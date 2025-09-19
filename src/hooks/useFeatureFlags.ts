import { useState, useEffect, useCallback } from 'react'
import { featureFlagService } from '@/lib/featureFlagService'
import { UserContext, RemoteConfigKey } from '@/lib/featureFlagTypes'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from './useAnalytics'

export const useFeatureFlags = () => {
  const [userContext, setUserContext] = useState<UserContext>({})
  const [isLoading, setIsLoading] = useState(true)
  const { track } = useAnalytics()

  useEffect(() => {
    loadUserContext()
  }, [])

  const loadUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Get user's family context
      const { data: membership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      // Get user profile for additional context
      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()

      // Calculate user cohort (signup week)
      const signupDate = new Date(user.created_at)
      const yearStart = new Date(signupDate.getFullYear(), 0, 1)
      const weekNumber = Math.ceil((signupDate.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const cohort = `${signupDate.getFullYear()}_W${weekNumber}`

      setUserContext({
        user_id: user.id,
        family_id: membership?.family_id || undefined,
        user_role: (profile?.settings as any)?.role || 'user',
        user_country: 'US', // Could be determined from IP or user settings
        user_cohort: cohort
      })
    } catch (error) {
      console.error('Error loading user context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isEnabled = useCallback(async (flagKey: string): Promise<boolean> => {
    try {
      const result = await featureFlagService.isEnabled(flagKey, userContext)
      
      // Track flag evaluation
      await track('flag_enabled', {
        flag_key: flagKey,
        enabled: result,
        user_context: userContext
      })
      
      return result
    } catch (error) {
      console.error(`Error checking feature flag ${flagKey}:`, error)
      return false
    }
  }, [userContext, track])

  const getConfig = useCallback(async <T = any>(configKey: RemoteConfigKey): Promise<T> => {
    try {
      return await featureFlagService.getConfig<T>(configKey)
    } catch (error) {
      console.error(`Error getting config ${configKey}:`, error)
      return featureFlagService['cache'].config[configKey] || null
    }
  }, [])

  const getAllConfig = useCallback(async (): Promise<Record<string, any>> => {
    try {
      return await featureFlagService.getAllConfig()
    } catch (error) {
      console.error('Error getting all config:', error)
      return {}
    }
  }, [])

  const refreshCache = useCallback(() => {
    featureFlagService.clearCache()
  }, [])

  return {
    isEnabled,
    getConfig,
    getAllConfig,
    refreshCache,
    userContext,
    isLoading
  }
}

// Hook for admin functionality
export const useFeatureFlagAdmin = () => {
  const [flags, setFlags] = useState([])
  const [config, setConfig] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { track } = useAnalytics()

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [flagsData, configData] = await Promise.all([
        featureFlagService.getFlags(),
        featureFlagService.getRemoteConfig()
      ])
      setFlags(flagsData as any)
      setConfig(configData as any)
    } catch (error) {
      console.error('Error loading feature flag admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const createFlag = useCallback(async (flagData: any) => {
    try {
      const newFlag = await featureFlagService.createFlag(flagData)
      await track('flag_created', {
        flag_id: newFlag.id,
        flag_key: newFlag.key,
        flag_name: newFlag.name
      })
      await loadData()
      return newFlag
    } catch (error) {
      console.error('Error creating feature flag:', error)
      throw error
    }
  }, [loadData, track])

  const updateFlag = useCallback(async (flagId: string, updates: any) => {
    try {
      const updatedFlag = await featureFlagService.updateFlag(flagId, updates)
      await loadData()
      return updatedFlag
    } catch (error) {
      console.error('Error updating feature flag:', error)
      throw error
    }
  }, [loadData])

  const deleteFlag = useCallback(async (flagId: string) => {
    try {
      await featureFlagService.deleteFlag(flagId)
      await loadData()
    } catch (error) {
      console.error('Error deleting feature flag:', error)
      throw error
    }
  }, [loadData])

  const createTargetingRule = useCallback(async (ruleData: any) => {
    try {
      const newRule = await featureFlagService.createTargetingRule(ruleData)
      await track('flag_targeting_updated', {
        flag_id: ruleData.flag_id,
        targeting_type: ruleData.targeting_type,
        targeting_value: ruleData.targeting_value
      })
      return newRule
    } catch (error) {
      console.error('Error creating targeting rule:', error)
      throw error
    }
  }, [track])

  const updateConfig = useCallback(async (configId: string, updates: any) => {
    try {
      const updatedConfig = await featureFlagService.updateRemoteConfig(configId, updates)
      await loadData()
      return updatedConfig
    } catch (error) {
      console.error('Error updating remote config:', error)
      throw error
    }
  }, [loadData])

  return {
    flags,
    config,
    isLoading,
    loadData,
    createFlag,
    updateFlag,
    deleteFlag,
    createTargetingRule,
    updateConfig
  }
}