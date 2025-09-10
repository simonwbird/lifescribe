import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import MediaUploader from '@/components/MediaUploader'
import TagSelector from '@/components/TagSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

export default function NewStory() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [linkedPersonId, setLinkedPersonId] = useState<string | null>(null)
  const [linkedPersonName, setLinkedPersonName] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Check if we have person context from URL params
    const personId = searchParams.get('person')
    const personName = searchParams.get('personName')
    
    if (personId && personName) {
      setLinkedPersonId(personId)
      setLinkedPersonName(decodeURIComponent(personName))
      setTitle(`Story about ${decodeURIComponent(personName)}`)
    }
    
    // Check if we have prompt context from URL params
    const promptTitle = searchParams.get('prompt')
    const promptDescription = searchParams.get('description')
    
    if (promptTitle) {
      setTitle(decodeURIComponent(promptTitle))
      if (promptDescription) {
        setContent(`${decodeURIComponent(promptDescription)}\n\n`)
      }
      // Add prompt-related tag
      setTags(['memory-prompt'])
    }
    
    const getFamilyId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()
        
        if (member) {
          setFamilyId(member.family_id)
        }
      }
    }
    getFamilyId()
  }, [searchParams])

  const handleAddTag = (e: React.KeyboardEvent) => {
    // This function is no longer needed as TagSelector handles tag management
  }

  const handleRemoveTag = (tagToRemove: string) => {
    // This function is no longer needed as TagSelector handles tag management
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !familyId) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single()

      if (storyError) throw storyError

      // If this story is about a specific person, link it
      if (linkedPersonId && story) {
        await supabase
          .from('person_story_links')
          .insert({
            person_id: linkedPersonId,
            story_id: story.id,
            family_id: familyId
          })
      }

      // Upload media files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Save media record
          await supabase
            .from('media')
            .insert({
              story_id: story.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type,
            })
        }
      }

      navigate('/feed')
    } catch (error) {
      console.error('Error creating story:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  {linkedPersonName ? `Share a Story About ${linkedPersonName}` : 
                   searchParams.get('prompt') ? 'Memory Prompt' : 'Share Your Story'}
                </CardTitle>
                <CardDescription>
                  {linkedPersonName 
                    ? `Tell a story or memory about ${linkedPersonName} to preserve for the family`
                    : searchParams.get('prompt')
                    ? 'Share your memory based on this prompt'
                    : 'Create a new family memory to share with everyone'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={linkedPersonName 
                        ? `Share a memory about ${linkedPersonName}...`
                        : searchParams.get('prompt')
                        ? "Give this memory a title..."
                        : "Give your story a title..."
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Story</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={linkedPersonName
                        ? `Tell us about ${linkedPersonName}. What are your favorite memories? What was special about them?`
                        : searchParams.get('prompt')
                        ? "Share your memory here..."
                        : "Tell your story..."
                      }
                      rows={8}
                      required
                    />
                  </div>

                  <TagSelector
                    selectedTags={tags}
                    onTagsChange={setTags}
                    familyId={familyId}
                  />

                  <div className="space-y-2">
                    <Label>Photos & Videos</Label>
                    <MediaUploader
                      onFilesSelected={setUploadedFiles}
                      maxFiles={5}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
                      {loading ? 'Sharing...' : 'Share Story'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/feed')}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}