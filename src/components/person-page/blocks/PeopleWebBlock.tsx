import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, ExternalLink, Heart } from 'lucide-react'
import { usePersonRelationships } from '@/hooks/usePersonRelationships'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AvatarService } from '@/lib/avatarService'
import { getSignedMediaUrl } from '@/lib/media'
import { supabase } from '@/integrations/supabase/client'

interface PeopleWebBlockProps {
  personId: string
  currentUserId: string | null
}

export default function PeopleWebBlock({ personId, currentUserId }: PeopleWebBlockProps) {
  const navigate = useNavigate()
  const { relationships, loading, error } = usePersonRelationships(personId, currentUserId)
  const [resolvedAvatars, setResolvedAvatars] = useState<Record<string, string | null>>({})

  // Resolve avatar URLs from storage
  useEffect(() => {
    const resolveAvatars = async () => {
      if (!relationships.length) return

      // Get family_id from the first person
      const firstPersonId = relationships[0]?.person_id
      if (!firstPersonId) return

      const { data: personData } = await supabase
        .from('people')
        .select('family_id')
        .eq('id', firstPersonId)
        .single()

      const familyId = personData?.family_id
      if (!familyId) return

      const resolved: Record<string, string | null> = {}

      for (const rel of relationships) {
        if (!rel.person_avatar) {
          resolved[rel.person_id] = null
          continue
        }

        const avatarUrl = rel.person_avatar

        // If it's already a full URL, check if it needs refresh
        if (avatarUrl.startsWith('http')) {
          const refreshed = await AvatarService.getValidAvatarUrl(avatarUrl)
          resolved[rel.person_id] = refreshed
          continue
        }

        // If it's a storage path, get signed URL
        const signedUrl = await getSignedMediaUrl(avatarUrl, familyId)
        resolved[rel.person_id] = signedUrl
      }

      setResolvedAvatars(resolved)
    }

    resolveAvatars()
  }, [relationships])

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

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([label, rels]) => (
        <div key={label}>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            {label}{rels.length > 1 ? 's' : ''}
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
                <Avatar className="h-12 w-12">
                  <AvatarImage src={resolvedAvatars[rel.person_id] || ''} alt={rel.person_name} />
                  <AvatarFallback>
                    {rel.person_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{rel.person_name}</p>
                    {rel.person_status === 'passed' && (
                      <Badge variant="secondary" className="text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        In Tribute
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{rel.relation_label}</p>
                </div>

                <div className="flex items-center gap-2">
                  {rel.has_page_access ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/family/tree?focus=${rel.person_id}`)
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View in Tree
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span className="text-xs">Private</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}