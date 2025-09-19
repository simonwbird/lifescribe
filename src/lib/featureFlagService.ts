import { supabase } from './supabase'
import { 
  FeatureFlag, 
  FeatureFlagTargeting, 
  RemoteConfig, 
  FeatureFlagEvaluation, 
  UserContext, 
  FeatureFlagCache,
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  CreateTargetingRuleRequest,
  UpdateRemoteConfigRequest,
  DEFAULT_REMOTE_CONFIG,
  RemoteConfigKey
} from './featureFlagTypes'

class FeatureFlagService {
  private cache: FeatureFlagCache = {
    flags: {},
    config: {},
    lastFetched: 0,
    ttl: 5 * 60 * 1000 // 5 minutes
  }

  // Client SDK Methods
  async isEnabled(flagKey: string, userContext?: UserContext): Promise<boolean> {
    const evaluation = await this.evaluateFlag(flagKey, userContext)
    return evaluation.enabled
  }

  async getConfig<T = any>(configKey: RemoteConfigKey): Promise<T> {
    await this.refreshCacheIfNeeded()
    
    if (configKey in this.cache.config) {
      return this.cache.config[configKey]
    }
    
    // Fallback to default value
    return DEFAULT_REMOTE_CONFIG[configKey] as T
  }

  async getAllConfig(): Promise<Record<string, any>> {
    await this.refreshCacheIfNeeded()
    return { ...DEFAULT_REMOTE_CONFIG, ...this.cache.config }
  }

  async evaluateFlag(flagKey: string, userContext?: UserContext): Promise<FeatureFlagEvaluation> {
    await this.refreshCacheIfNeeded()
    
    if (flagKey in this.cache.flags) {
      return this.cache.flags[flagKey]
    }

    // Evaluate flag via database function
    const { data, error } = await supabase.rpc('evaluate_feature_flag', {
      p_flag_key: flagKey,
      p_user_id: userContext?.user_id || null,
      p_family_id: userContext?.family_id || null,
      p_user_role: userContext?.user_role || null,
      p_user_country: userContext?.user_country || null,
      p_user_cohort: userContext?.user_cohort || null
    })

    if (error) {
      console.error('Error evaluating feature flag:', error)
      return { enabled: false, reason: 'evaluation_error' }
    }

    const evaluation = data as unknown as FeatureFlagEvaluation
    this.cache.flags[flagKey] = evaluation
    
    return evaluation
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now()
    const isExpired = now - this.cache.lastFetched > this.cache.ttl
    
    if (!isExpired && Object.keys(this.cache.config).length > 0) {
      return
    }

    try {
      // Fetch remote config
      const { data: configData, error: configError } = await supabase
        .from('remote_config')
        .select('key, current_value')
        .eq('is_active', true)

      if (configError) {
        console.error('Error fetching remote config:', configError)
        return
      }

      // Update config cache
      const configMap: Record<string, any> = {}
      configData?.forEach(config => {
        configMap[config.key] = config.current_value
      })
      
      this.cache.config = configMap
      this.cache.lastFetched = now
    } catch (error) {
      console.error('Error refreshing feature flag cache:', error)
    }
  }

  clearCache(): void {
    this.cache = {
      flags: {},
      config: {},
      lastFetched: 0,
      ttl: 5 * 60 * 1000
    }
  }

  // Admin Methods
  async getFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createFlag(flagData: CreateFeatureFlagRequest): Promise<FeatureFlag> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('feature_flags')
      .insert({
        ...flagData,
        created_by: user.user.id,
        last_changed_by: user.user.id,
        last_changed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    
    this.clearCache()
    return data
  }

  async updateFlag(flagId: string, updates: UpdateFeatureFlagRequest): Promise<FeatureFlag> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('feature_flags')
      .update({
        ...updates,
        last_changed_by: user.user.id,
        last_changed_at: new Date().toISOString()
      })
      .eq('id', flagId)
      .select()
      .single()

    if (error) throw error
    
    this.clearCache()
    return data
  }

  async deleteFlag(flagId: string): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', flagId)

    if (error) throw error
    
    this.clearCache()
  }

  async getTargetingRules(flagId: string): Promise<FeatureFlagTargeting[]> {
    const { data, error } = await supabase
      .from('feature_flag_targeting')
      .select('*')
      .eq('flag_id', flagId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createTargetingRule(ruleData: CreateTargetingRuleRequest): Promise<FeatureFlagTargeting> {
    const { data, error } = await supabase
      .from('feature_flag_targeting')
      .insert({
        ...ruleData,
        targeting_value: JSON.stringify(ruleData.targeting_value)
      })
      .select()
      .single()

    if (error) throw error
    
    this.clearCache()
    return data
  }

  async updateTargetingRule(ruleId: string, updates: Partial<FeatureFlagTargeting>): Promise<FeatureFlagTargeting> {
    const { data, error } = await supabase
      .from('feature_flag_targeting')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single()

    if (error) throw error
    
    this.clearCache()
    return data
  }

  async deleteTargetingRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('feature_flag_targeting')
      .delete()
      .eq('id', ruleId)

    if (error) throw error
    
    this.clearCache()
  }

  async getRemoteConfig(): Promise<RemoteConfig[]> {
    const { data, error } = await supabase
      .from('remote_config')
      .select('*')
      .order('key')

    if (error) throw error
    return data as RemoteConfig[] || []
  }

  async updateRemoteConfig(configId: string, updates: UpdateRemoteConfigRequest): Promise<RemoteConfig> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('remote_config')
      .update({
        ...updates,
        last_changed_by: user.user.id,
        last_changed_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single()

    if (error) throw error
    
    this.clearCache()
    return data as RemoteConfig
  }

  async getAnalytics(flagId?: string, days: number = 7): Promise<any[]> {
    let query = supabase
      .from('feature_flag_analytics')
      .select(`
        *,
        feature_flags(name, key)
      `)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (flagId) {
      query = query.eq('flag_id', flagId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }
}

export const featureFlagService = new FeatureFlagService()
export { FeatureFlagService }