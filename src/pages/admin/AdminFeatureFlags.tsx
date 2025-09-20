import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager'

export default function AdminFeatureFlags() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-muted-foreground">
          Configure and manage platform feature rollouts
        </p>
      </div>
      
      <FeatureFlagManager />
    </div>
  )
}