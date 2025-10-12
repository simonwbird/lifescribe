import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Lock, ExternalLink, Heart, TreePine } from 'lucide-react'
import { usePersonRelationships } from '@/hooks/usePersonRelationships'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AvatarService } from '@/lib/avatarService'
import { getSignedMediaUrl } from '@/lib/media'
import { supabase } from '@/integrations/supabase/client'
import { AccessRequestDialog } from './AccessRequestDialog'
import { Badge } from '@/components/ui/badge'

interface PeopleWebBlockProps {
  personId: string
  currentUserId: string | null
  familyId?: string
}

export default function PeopleWebBlock({ personId, currentUserId, familyId }: PeopleWebBlockProps) {
  const navigate = useNavigate()
  const { relationships, loading, error } = usePersonRelationships(personId, currentUserId)
  const [resolvedAvatars, setResolvedAvatars] = useState<Record<string, string | null>>({})
  const [requestingAccessFor, setRequestingAccessFor] = useState<{
    id: string
    name: string
  } | null>(null)

  // Resolve avatar URLs from storage
  useEffect(() => {
    const resolveAvatars = async () => {
      if (!relationships.length) return

      // Use provided familyId or try to infer from a storage path
      const inferFamilyId = (): string | null => {
        for (const rel of relationships) {
          const url = rel.person_avatar || ''
          if (url && !url.startsWith('http') && url.includes('/')) {
            return url.split('/')[0] || null
          }
        }
        return null
      }

      const effectiveFamilyId = familyId || inferFamilyId()

      const resolved: Record<string, string | null> = {}

      for (const rel of relationships) {
        const avatarUrl = rel.person_avatar
        if (!avatarUrl) {
          resolved[rel.person_id] = null
          continue
        }

        // Case 1: Already a Supabase signed URL -> try refresh; if fails, try media-proxy
        if (avatarUrl.includes('supabase.co/storage/v1/object/sign')) {
          let refreshed = await AvatarService.refreshSignedUrl(avatarUrl)
          if (!refreshed && effectiveFamilyId) {
            // Fallback: extract path and sign via proxy
            const path = AvatarService.extractFilePath(avatarUrl)
            if (path) {
              refreshed = await getSignedMediaUrl(path, effectiveFamilyId)
            }
          }
          resolved[rel.person_id] = refreshed ?? avatarUrl
          continue
        }

        // Case 2: Full non-signed URL -> use as-is
        if (avatarUrl.startsWith('http')) {
          resolved[rel.person_id] = avatarUrl
          continue
        }

        // Case 3: Storage path -> sign via media-proxy
        if (effectiveFamilyId) {
          resolved[rel.person_id] = await getSignedMediaUrl(avatarUrl, effectiveFamilyId)
        } else {
          resolved[rel.person_id] = null
        }
      }

      setResolvedAvatars(resolved)
    }

    resolveAvatars()
  }, [relationships, familyId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Unable to load relationships</p>
      </div>
    )
  }

  if (relationships.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No family connections added yet</p>
      </div>
    )
  }

  // Group by relation type
  const grouped = relationships.reduce((acc, rel) => {
    const key = rel.relation_label
    if (!acc[key]) acc[key] = []
    acc[key].push(rel)
    return acc
  }, {} as Record<string, typeof relationships>)

  // Helper to pluralize labels correctly
  const pluralize = (label: string, count: number) => {
    if (count === 1) return label
    if (label === 'Child') return 'Children'
    return label + 's'
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([label, rels]) => (
        <div key={label}>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            {pluralize(label, rels.length)}
          </h4>
          <div className="space-y-2">
            {rels.map((rel) => (
              <div
                key={rel.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  rel.has_page_access 
                    ? "hover:bg-accent cursor-pointer" 
                    : "bg-muted/50"
                )}
                onClick={() => {
                  if (rel.has_page_access) {
                    navigate(`/people/${rel.person_id}/page`)
                  }
                }}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={resolvedAvatars[rel.person_id] ?? (rel.person_avatar?.startsWith('http') ? rel.person_avatar : '')} alt={rel.person_name} />
                  <AvatarFallback>
                    {rel.person_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{rel.person_name}</p>
                    {rel.person_status === 'passed' && (
                      <Badge 
                        variant="secondary" 
                        className="shrink-0 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                      >
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        In Tribute
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{rel.relation_label}</p>
                    {rel.has_page_access && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/family/tree?focus=${rel.person_id}`)
                        }}
                      >
                        <TreePine className="h-3 w-3 mr-1" />
                        Tree
                      </Button>
                    )}
                  </div>
                </div>

                {!rel.has_page_access && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRequestingAccessFor({
                        id: rel.person_id,
                        name: rel.person_name
                      })
                    }}
                  >
                    <Lock className="h-3 w-3 mr-1.5" />
                    Request Access
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Access Request Dialog */}
      {requestingAccessFor && familyId && (
        <AccessRequestDialog
          open={!!requestingAccessFor}
          onOpenChange={(open) => !open && setRequestingAccessFor(null)}
          personId={requestingAccessFor.id}
          personName={requestingAccessFor.name}
          familyId={familyId}
        />
      )}
    </div>
  )
}