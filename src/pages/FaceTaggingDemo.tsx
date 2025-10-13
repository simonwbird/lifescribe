import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import MediaWithFaceTagger from '@/components/media/MediaWithFaceTagger'
import { supabase } from '@/integrations/supabase/client'

export default function FaceTaggingDemo() {
  const [familyId, setFamilyId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    loadUserContext()
  }, [])

  const loadUserContext = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      
      // Get user's primary family
      // @ts-ignore
      const { data: members } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle()
      
      if (members) {
        setFamilyId(members.family_id)
      }
    }
  }

  // Demo image URL - replace with actual image from media table
  const demoImageUrl = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800'
  const demoImageId = 'demo-image-123'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold mb-2">Face Tagging Demo</h1>
          <p className="text-muted-foreground">
            Hover over the image and click "Tag Faces" to start. Draw a box around a face to tag it.
          </p>
        </div>

        {familyId ? (
          <MediaWithFaceTagger
            imageUrl={demoImageUrl}
            imageId={demoImageId}
            familyId={familyId}
            onTagged={() => console.log('Face tagged!')}
          />
        ) : (
          <p className="text-center text-muted-foreground">Loading...</p>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Features:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Draw rectangles by clicking and dragging on faces</li>
            <li>AI suggestions with confidence scores (&gt;85% shows quick confirm)</li>
            <li>Keyboard navigation: ↑↓ to navigate, Enter to confirm, Esc to cancel</li>
            <li>High-contrast handles for accessibility</li>
            <li>ARIA labels for screen readers</li>
            <li>Search for people by name</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
