import { useEffect, useRef } from 'react'
import { useFamilyFeed } from './useFamilyFeed'
import { FeedCard } from './FeedCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

interface FamilyFeedProps {
  familyId: string
  userId: string
}

export function FamilyFeed({ familyId, userId }: FamilyFeedProps) {
  const { items, loadMore, hasMore, isLoading } = useFamilyFeed(familyId, { limit: 10 })
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || isLoading || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMore()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [isLoading, hasMore, loadMore])

  return (
    <div className="space-y-4">
      {/* Feed Items */}
      {items.map((story) => (
        <FeedCard key={story.id} story={story} />
      ))}

      {/* Loading State */}
      {isLoading && items.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      {hasMore && items.length > 0 && (
        <div ref={sentinelRef} className="py-8 flex justify-center">
          {isLoading && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && items.length > 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          You've reached the end of the feed
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No stories yet. Start sharing memories with your family!
          </p>
        </div>
      )}
    </div>
  )
}
