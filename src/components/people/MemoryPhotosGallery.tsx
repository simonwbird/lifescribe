import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Camera, Upload, Calendar, X, Plus, ChevronLeft, ChevronRight, Trash2, MoreHorizontal, Edit2, Tag } from 'lucide-react'
import { Person } from '@/utils/personUtils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile, getSignedMediaUrl } from '@/lib/media'
import { format } from 'date-fns'

interface MemoryPhotosGalleryProps {
  person: Person
}

interface FamilyMember {
  id: string
  full_name: string
}

interface FaceTag {
  id: string
  media_id: string
  person_id: string
  person_name: string
  x_percent: number
  y_percent: number
  width_percent: number
  height_percent: number
}

interface MemoryPhoto {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  file_size: number
  created_at: string
  profile_id: string
  story_id: string | null
  individual_story_id?: string | null
  story?: {
    id: string
    title: string
    content: string
    occurred_on: string | null
  } | null
  individual_story?: {
    id: string
    title: string
    content: string
    occurred_on: string | null
  } | null
  face_tags?: FaceTag[]
}

export function MemoryPhotosGallery({ person }: MemoryPhotosGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<MemoryPhoto[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [photoTitle, setPhotoTitle] = useState('')
  const [photoDescription, setPhotoDescription] = useState('')
  const [photoDate, setPhotoDate] = useState('')
  const [approxMonth, setApproxMonth] = useState('')
  const [approxYear, setApproxYear] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [taggedPeople, setTaggedPeople] = useState<string[]>([person.id])
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('')
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false)
  const [selectedStoryForAdd, setSelectedStoryForAdd] = useState<string | null>(null)
  const [showEditStoryModal, setShowEditStoryModal] = useState(false)
  const [editingStory, setEditingStory] = useState<any>(null)
  const [isCreatingStory, setIsCreatingStory] = useState(false)
  const [currentPhotoForStory, setCurrentPhotoForStory] = useState<any>(null)
  const [editStoryTitle, setEditStoryTitle] = useState('')
  const [editStoryContent, setEditStoryContent] = useState('')
  const [editStoryDate, setEditStoryDate] = useState('')
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [inlineStoryTitle, setInlineStoryTitle] = useState('')
  const [inlineStoryContent, setInlineStoryContent] = useState('')
  const [inlineStoryDate, setInlineStoryDate] = useState('')
  
  // Face tagging state
  const [isTaggingMode, setIsTaggingMode] = useState(false)
  const [isDrawingTag, setIsDrawingTag] = useState(false)
  const [tagStartPos, setTagStartPos] = useState<{x: number, y: number} | null>(null)
  const [currentTag, setCurrentTag] = useState<{x: number, y: number, width: number, height: number} | null>(null)
  const [showTagPersonModal, setShowTagPersonModal] = useState(false)
  const [selectedPersonForTag, setSelectedPersonForTag] = useState<string>('')
  const [faceTags, setFaceTags] = useState<FaceTag[]>([])
  const [hoveredPhotoId, setHoveredPhotoId] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Fetch photos when component mounts or person changes
  useEffect(() => {
    // Clear existing photos to avoid showing stale data
    setPhotos([])
    setPhotoUrls({})
    fetchPhotos()
  }, [person.id])

  // Fetch family members for people tagging
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('people')
          .select('id, full_name')
          .eq('family_id', (person as any).family_id)
          .order('full_name')

        if (error) throw error
        setFamilyMembers(data || [])
      } catch (error) {
        console.error('Failed to fetch family members:', error)
      }
    }
    
    fetchFamilyMembers()
  }, [person.id])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check file types - allow images only
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ]

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format.`,
          variant: "destructive"
        })
        return false
      }

      // Check file size (5MB limit for images)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large", 
          description: `${file.name} must be under 5MB.`,
          variant: "destructive"
        })
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      setShowUploadModal(true)
    }

    // Reset input
    event.target.value = ''
  }

  const handleUploadWithStory = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create a story for this memory  
      let occurred_on = null
      let occurred_precision = null
      
      if (photoDate) {
        occurred_on = format(new Date(photoDate), 'yyyy-MM-dd')
        occurred_precision = 'day'
      } else if (approxYear) {
        if (approxMonth) {
          occurred_on = `${approxYear}-${approxMonth.padStart(2, '0')}-01`
          occurred_precision = 'month'
        } else {
          occurred_on = `${approxYear}-01-01`
          occurred_precision = 'year'
        }
      }
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: photoTitle.trim() || `Memory photos - ${new Date().toLocaleDateString()}`,
          content: photoDescription.trim() || `Memory photos shared for ${person.full_name}`,
          occurred_on,
          occurred_precision: occurred_on ? 'day' : null,
          family_id: (person as any).family_id,
          profile_id: user.id
        })
        .select()
        .single()

      if (storyError || !story) throw storyError || new Error('Failed to create story')

      // Link story to all tagged people
      const linkPromises = taggedPeople.map(personId => 
        supabase
          .from('person_story_links')
          .insert({
            person_id: personId,
            story_id: story.id,
            family_id: (person as any).family_id
          })
      )
      
      const linkResults = await Promise.all(linkPromises)
      const linkErrors = linkResults.filter(result => result.error)
      if (linkErrors.length > 0) {
        console.error('Some person links failed:', linkErrors)
      }

      // Upload all files and create media records
      let uploadedCount = 0
      for (const file of selectedFiles) {
        try {
          const { path, error: uploadError } = await uploadMediaFile(
            file,
            (person as any).family_id,
            user.id
          )

          if (uploadError) {
            console.error('Failed to upload file:', uploadError)
            continue
          }

          // Create media record
          const { error: mediaError } = await supabase
            .from('media')
            .insert({
              file_path: path,
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
              family_id: (person as any).family_id,
              profile_id: user.id,
              story_id: story.id
            })

          if (mediaError) {
            console.error('Failed to create media record:', mediaError)
            continue
          }

          uploadedCount++
        } catch (error) {
          console.error('Error uploading file:', file.name, error)
        }
      }

      if (uploadedCount > 0) {
        toast({
          title: "Photos uploaded",
          description: `${uploadedCount} photo${uploadedCount > 1 ? 's' : ''} uploaded successfully.`
        })

        // Reset modal state
        setShowUploadModal(false)
        setSelectedFiles([])
        setPhotoTitle('')
        setPhotoDescription('')
        setPhotoDate('')
        setApproxMonth('')
        setApproxYear('')
        setTaggedPeople([person.id])
        setPeopleSearchQuery('')
        setShowPeopleDropdown(false)
        
        // Refresh photos
        fetchPhotos()
      } else {
        throw new Error('No photos were uploaded successfully')
      }

    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: "Upload failed",
        description: "Could not upload the photos. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', photoId)
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)

      if (error) throw error

      toast({
        title: "Photo deleted",
        description: "The photo has been removed from this memory."
      })

      // Refresh photos and close lightbox if this was the current photo
      fetchPhotos()
      setShowLightbox(false)
    } catch (error) {
      console.error('Failed to delete photo:', error)
      toast({
        title: "Delete failed",
        description: "Could not delete the photo. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddPhotosToStory = (storyId: string) => {
    setSelectedStoryForAdd(storyId)
    // Trigger file selection
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.multiple = true
    fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
    fileInput.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        handleAddPhotosToExistingStory(storyId, files)
      }
    }
    fileInput.click()
  }

  const handleAddPhotosToExistingStory = async (storyId: string, files: File[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let uploadedCount = 0
      for (const file of files) {
        try {
          const { path, error: uploadError } = await uploadMediaFile(
            file,
            (person as any).family_id,
            user.id
          )

          if (uploadError) {
            console.error('Failed to upload file:', uploadError)
            continue
          }

          // Create media record linked to existing story
          const { error: mediaError } = await supabase
            .from('media')
            .insert({
              file_path: path,
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
              family_id: (person as any).family_id,
              profile_id: user.id,
              story_id: storyId
            })

          if (mediaError) {
            console.error('Failed to create media record:', mediaError)
            continue
          }

          uploadedCount++
        } catch (error) {
          console.error('Error uploading file:', file.name, error)
        }
      }

      if (uploadedCount > 0) {
        toast({
          title: "Photos added",
          description: `${uploadedCount} photo${uploadedCount > 1 ? 's' : ''} added to the memory.`
        })
        fetchPhotos()
      } else {
        throw new Error('No photos were uploaded successfully')
      }
    } catch (error) {
      console.error('Failed to add photos:', error)
      toast({
        title: "Upload failed",
        description: "Could not add photos to the memory. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSelectedStoryForAdd(null)
    }
  }

  const handleEditStory = async (story: any) => {
    setEditingStory(story)
    setEditStoryTitle(story.title || '')
    setEditStoryContent(story.content || '')
    setEditStoryDate(story.occurred_on || '')
    
    // Fetch people linked to this story
    try {
      const { data: linkedPeople } = await supabase
        .from('person_story_links')
        .select('person_id')
        .eq('story_id', story.id)
      
      const linkedPersonIds = linkedPeople?.map(link => link.person_id) || []
      
      // Also include people from face tags if currentPhoto exists
      if (currentPhoto && currentPhoto.face_tags) {
        const faceTaggedPeople = currentPhoto.face_tags.map((tag: FaceTag) => tag.person_id)
        const allPeople = [...new Set([...linkedPersonIds, ...faceTaggedPeople])]
        setTaggedPeople(allPeople)
      } else {
        setTaggedPeople(linkedPersonIds)
      }
    } catch (error) {
      console.error('Failed to fetch story people:', error)
      // Fallback to face tags if available, otherwise just the main person
      if (currentPhoto && currentPhoto.face_tags) {
        const faceTaggedPeople = currentPhoto.face_tags.map((tag: FaceTag) => tag.person_id)
        const allPeople = [...new Set([person.id, ...faceTaggedPeople])]
        setTaggedPeople(allPeople)
      } else {
        setTaggedPeople([person.id])
      }
    }
    
    setShowEditStoryModal(true)
  }

  const handleAddStory = async (photo: any) => {
    setIsCreatingStory(true)
    setCurrentPhotoForStory(photo)
    setEditingStory(null)
    setEditStoryTitle('')
    setEditStoryContent('')
    setEditStoryDate('')
    
    // Auto-populate with people from face tags plus the main person
    const faceTaggedPeople = photo.face_tags?.map((tag: FaceTag) => tag.person_id) || []
    const allTaggedPeople = [...new Set([person.id, ...faceTaggedPeople])]
    setTaggedPeople(allTaggedPeople)
    
    setShowEditStoryModal(true)
  }

  const handleCreateStory = async () => {
    if (!currentPhotoForStory || !editStoryTitle.trim()) return

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create new story
      const { data: newStory, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: editStoryTitle,
          content: editStoryContent,
          occurred_on: editStoryDate || null,
          family_id: person.family_id,
          profile_id: user.id
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Link photo to individual story (not group story)
      const { error: updateError } = await supabase
        .from('media')
        .update({ individual_story_id: newStory.id })
        .eq('id', currentPhotoForStory.id)

      if (updateError) throw updateError

      // Link people to story
      if (taggedPeople.length > 0) {
        const personLinks = taggedPeople.map(personId => ({
          person_id: personId,
          story_id: newStory.id,
          family_id: person.family_id
        }))

        const { error: insertLinksError } = await supabase
          .from('person_story_links')
          .insert(personLinks)

        if (insertLinksError) throw insertLinksError
      }

      toast({
        title: "Story added",
        description: "Your story has been added to this photo successfully."
      })

      setShowEditStoryModal(false)
      setIsCreatingStory(false)
      setCurrentPhotoForStory(null)
      setEditingStory(null)
      setEditStoryTitle('')
      setEditStoryContent('')
      setEditStoryDate('')
      setTaggedPeople([person.id])
      setPeopleSearchQuery('')
      setShowPeopleDropdown(false)
      fetchPhotos() // Refresh to show new story

    } catch (error) {
      console.error('Failed to create story:', error)
      toast({
        title: "Failed to create story",
        description: "Could not add the story to this photo. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateStory = async () => {
    if (!editingStory) return

    try {
      // Update story details
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          title: editStoryTitle.trim(),
          content: editStoryContent.trim(),
          occurred_on: editStoryDate || null
        })
        .eq('id', editingStory.id)

      if (updateError) throw updateError

      // Update people links - remove existing and add new ones
      const { error: deleteLinksError } = await supabase
        .from('person_story_links')
        .delete()
        .eq('story_id', editingStory.id)

      if (deleteLinksError) throw deleteLinksError

      // Add new people links
      if (taggedPeople.length > 0) {
        const linkInserts = taggedPeople.map(personId => ({
          person_id: personId,
          story_id: editingStory.id,
          family_id: (person as any).family_id
        }))

        const { error: insertLinksError } = await supabase
          .from('person_story_links')
          .insert(linkInserts)

        if (insertLinksError) throw insertLinksError
      }

      toast({
        title: "Story updated",
        description: "The memory story has been updated successfully."
      })

      setShowEditStoryModal(false)
      setEditingStory(null)
      setEditStoryTitle('')
      setEditStoryContent('')
      setEditStoryDate('')
      setTaggedPeople([person.id])
      setPeopleSearchQuery('')
      setShowPeopleDropdown(false)
      fetchPhotos() // Refresh to show updated story
    } catch (error) {
      console.error('Failed to update story:', error)
      toast({
        title: "Update failed",
        description: "Could not update the story. Please try again.",
        variant: "destructive"
      })
    }
  }

  const fetchPhotos = async () => {
    try {
      // First get the basic media records
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('family_id', (person as any).family_id)
        .in('mime_type', [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/webp',
          'image/gif'
        ])
        .order('created_at', { ascending: false })

      if (mediaError) throw mediaError
      
      // Filter to only show photos linked to this person (either through group stories or individual stories)
      const { data: personStories } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', person.id)

      const personStoryIds = personStories?.map(link => link.story_id) || []
      
      const filteredPhotos = (mediaData || []).filter(photo => {
        // Include if linked to person through group story
        if (photo.story_id && personStoryIds.includes(photo.story_id)) {
          return true
        }
        // Include if has individual story linked to person
        if (photo.individual_story_id && personStoryIds.includes(photo.individual_story_id)) {
          return true
        }
        return false
      })

      // Now fetch the stories separately
      const storyIds = [...new Set([
        ...filteredPhotos.filter(p => p.story_id).map(p => p.story_id),
        ...filteredPhotos.filter(p => p.individual_story_id).map(p => p.individual_story_id)
      ].filter(Boolean))]

      const { data: storiesData } = storyIds.length > 0 ? await supabase
        .from('stories')
        .select('id, title, content, occurred_on')
        .in('id', storyIds) : { data: [] }

      const storiesMap = new Map(storiesData?.map(s => [s.id, s] as [string, any]) || [])

      // Combine media with stories
      const photosWithStories = filteredPhotos.map(photo => ({
        ...photo,
        story: photo.story_id ? storiesMap.get(photo.story_id) || null : null,
        individual_story: photo.individual_story_id ? storiesMap.get(photo.individual_story_id) || null : null,
      })) as MemoryPhoto[]

      // Fetch face tags for all photos
      const photoIds = photosWithStories.map(photo => photo.id)
      if (photoIds.length > 0) {
        const { data: faceTagsData } = await supabase
          .from('face_tags')
          .select('*')
          .in('media_id', photoIds)
          .eq('family_id', (person as any).family_id)

        if (faceTagsData && faceTagsData.length > 0) {
          // Get person names separately
          const personIds = [...new Set(faceTagsData.map(tag => tag.person_id))]
          const { data: peopleData } = await supabase
            .from('people')
            .select('id, full_name')
            .in('id', personIds)

          const peopleMap = new Map(peopleData?.map(p => [p.id, p.full_name]) || [])

          // Group face tags by media_id and add to photos
          const faceTagsByMedia: Record<string, FaceTag[]> = {}
          faceTagsData.forEach(tag => {
            const mediaId = tag.media_id
            if (!faceTagsByMedia[mediaId]) {
              faceTagsByMedia[mediaId] = []
            }
            faceTagsByMedia[mediaId].push({
              id: tag.id,
              media_id: tag.media_id,
              person_id: tag.person_id,
              person_name: peopleMap.get(tag.person_id) || 'Unknown',
              x_percent: Number(tag.x_percent),
              y_percent: Number(tag.y_percent),
              width_percent: Number(tag.width_percent),
              height_percent: Number(tag.height_percent)
            })
          })

          // Add face tags to photos
          const photosWithTags = photosWithStories.map(photo => ({
            ...photo,
            face_tags: faceTagsByMedia[photo.id] || []
          }))

          setPhotos(photosWithTags)
        } else {
          setPhotos(photosWithStories)
        }
      } else {
        setPhotos(photosWithStories)
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  const loadPhotoUrl = async (photo: MemoryPhoto) => {
    try {
      const signedUrl = await getSignedMediaUrl(photo.file_path, (person as any).family_id)
      if (signedUrl) {
        setPhotoUrls(prev => ({
          ...prev,
          [photo.id]: signedUrl
        }))
      }
    } catch (error) {
      console.error('Failed to load photo URL:', error)
    }
  }

  const openLightbox = (photoIndex: number) => {
    setCurrentPhotoIndex(photoIndex)
    setShowLightbox(true)
  }

  const navigatePrevious = () => {
    setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : photos.length - 1)
  }

  const navigateNext = () => {
    setCurrentPhotoIndex(prev => prev < photos.length - 1 ? prev + 1 : 0)
  }

  const currentPhoto = photos[currentPhotoIndex]

  // Initialize inline story fields when photo changes
  useEffect(() => {
    if (currentPhoto) {
      setInlineStoryTitle(currentPhoto.individual_story?.title || '')
      setInlineStoryContent(currentPhoto.individual_story?.content || '')
      setInlineStoryDate(currentPhoto.individual_story?.occurred_on || '')
      
      // Auto-populate tagged people from face tags
      const faceTaggedPeople = currentPhoto.face_tags?.map((tag: FaceTag) => tag.person_id) || []
      const allTaggedPeople = [...new Set([person.id, ...faceTaggedPeople])]
      setTaggedPeople(allTaggedPeople)
    }
  }, [currentPhotoIndex, photos])

  // Auto-save functionality
  const autoSaveStory = async (title: string, content: string, date: string) => {
    if (!currentPhoto) return

    setIsSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      if (currentPhoto.individual_story?.id) {
        // Update existing individual story
        const { error: updateError } = await supabase
          .from('stories')
          .update({
            title: title.trim(),
            content: content.trim(),
            occurred_on: date || null
          })
          .eq('id', currentPhoto.individual_story.id)

        if (updateError) throw updateError
      } else if (title.trim() || content.trim()) {
        // Create new individual story
        const { data: newStory, error: storyError } = await supabase
          .from('stories')
          .insert({
            title: title.trim(),
            content: content.trim(),
            occurred_on: date || null,
            family_id: person.family_id,
            profile_id: user.id
          })
          .select()
          .single()

        if (storyError) throw storyError

        // Link photo to individual story
        const { error: updateError } = await supabase
          .from('media')
          .update({ individual_story_id: newStory.id })
          .eq('id', currentPhoto.id)

        if (updateError) throw updateError

        // Link people to story
        if (taggedPeople.length > 0) {
          const personLinks = taggedPeople.map(personId => ({
            person_id: personId,
            story_id: newStory.id,
            family_id: person.family_id
          }))

          await supabase
            .from('person_story_links')
            .insert(personLinks)
        }

        // Refresh photos to show new story
        fetchPhotos()
      }
    } catch (error) {
      console.error('Failed to auto-save story:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Debounced auto-save
  const handleInlineStoryChange = (field: 'title' | 'content' | 'date', value: string) => {
    if (field === 'title') setInlineStoryTitle(value)
    if (field === 'content') setInlineStoryContent(value)
    if (field === 'date') setInlineStoryDate(value)

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      const title = field === 'title' ? value : inlineStoryTitle
      const content = field === 'content' ? value : inlineStoryContent
      const date = field === 'date' ? value : inlineStoryDate
      autoSaveStory(title, content, date)
    }, 1000) // Auto-save after 1 second of no typing

    setAutoSaveTimeout(timeout)
  }

  useEffect(() => {
    photos.forEach(photo => {
      if (!photoUrls[photo.id]) {
        loadPhotoUrl(photo)
      }
    })
  }, [photos])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [autoSaveTimeout])

  // Face tagging functions
  const fetchFaceTags = async (mediaId: string) => {
    try {
      const { data, error } = await supabase
        .from('face_tags')
        .select(`
          id,
          media_id,
          person_id,
          x_percent,
          y_percent,
          width_percent,
          height_percent
        `)
        .eq('media_id', mediaId)
        .eq('family_id', (person as any).family_id)

      if (error) throw error

      if (!data || data.length === 0) return []

      // Get person names separately
      const personIds = data.map(tag => tag.person_id)
      const { data: peopleData } = await supabase
        .from('people')
        .select('id, full_name')
        .in('id', personIds)

      const peopleMap = new Map(peopleData?.map(p => [p.id, p.full_name]) || [])

      return data.map(tag => ({
        id: tag.id,
        media_id: tag.media_id,
        person_id: tag.person_id,
        person_name: peopleMap.get(tag.person_id) || 'Unknown',
        x_percent: Number(tag.x_percent),
        y_percent: Number(tag.y_percent),
        width_percent: Number(tag.width_percent),
        height_percent: Number(tag.height_percent)
      }))
    } catch (error) {
      console.error('Failed to fetch face tags:', error)
      return []
    }
  }

  const createFaceTag = async (mediaId: string, personId: string, coords: {x: number, y: number, width: number, height: number}) => {
    try {
      const { data, error } = await supabase
        .from('face_tags')
        .insert({
          media_id: mediaId,
          person_id: personId,
          family_id: (person as any).family_id,
          x_percent: coords.x,
          y_percent: coords.y,
          width_percent: coords.width,
          height_percent: coords.height,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()

      if (error) throw error

      // Refresh face tags for this photo
      const tags = await fetchFaceTags(mediaId)
      setFaceTags(tags)

      toast({
        title: "Face tagged",
        description: "Face has been tagged successfully",
      })
    } catch (error) {
      console.error('Failed to create face tag:', error)
      toast({
        title: "Error",
        description: "Failed to tag face",
        variant: "destructive",
      })
    }
  }

  const deleteFaceTag = async (tagId: string, mediaId: string) => {
    try {
      const { error } = await supabase
        .from('face_tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      // Refresh face tags for this photo
      const tags = await fetchFaceTags(mediaId)
      setFaceTags(tags)

      toast({
        title: "Tag removed",
        description: "Face tag has been removed",
      })
    } catch (error) {
      console.error('Failed to delete face tag:', error)
      toast({
        title: "Error",
        description: "Failed to remove face tag",
        variant: "destructive",
      })
    }
  }

  const handlePhotoMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTaggingMode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setTagStartPos({ x, y })
    setIsDrawingTag(true)
  }

  const handlePhotoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingTag || !tagStartPos) return

    const rect = e.currentTarget.getBoundingClientRect()
    const currentX = ((e.clientX - rect.left) / rect.width) * 100
    const currentY = ((e.clientY - rect.top) / rect.height) * 100

    const width = Math.abs(currentX - tagStartPos.x)
    const height = Math.abs(currentY - tagStartPos.y)
    const x = Math.min(tagStartPos.x, currentX)
    const y = Math.min(tagStartPos.y, currentY)

    setCurrentTag({ x, y, width, height })
  }

  const handlePhotoMouseUp = () => {
    if (!isDrawingTag || !currentTag || !tagStartPos) return

    // Only create tag if it's a reasonable size
    if (currentTag.width > 5 && currentTag.height > 5) {
      setShowTagPersonModal(true)
    } else {
      setCurrentTag(null)
    }

    setIsDrawingTag(false)
    setTagStartPos(null)
  }

  const handleTagPerson = () => {
    if (!currentTag || !selectedPersonForTag || !currentPhoto) return

    createFaceTag(currentPhoto.id, selectedPersonForTag, currentTag)
    setCurrentTag(null)
    setShowTagPersonModal(false)
    setSelectedPersonForTag('')
  }

  const cancelTagging = () => {
    setCurrentTag(null)
    setShowTagPersonModal(false)
    setSelectedPersonForTag('')
    setIsDrawingTag(false)
    setTagStartPos(null)
  }

  // Load face tags when lightbox opens
  useEffect(() => {
    if (showLightbox && currentPhoto) {
      fetchFaceTags(currentPhoto.id).then(setFaceTags)
    }
  }, [showLightbox, currentPhoto])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Memory Photos</CardTitle>
              <p className="text-xs text-muted-foreground">Share photos and memories</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={uploading} className="relative">
              <Plus className="h-4 w-4 mr-1" />
              {uploading ? 'Uploading...' : 'Add Photos'}
              <Input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No memory photos yet
              </p>
              <div className="relative inline-block">
                <Button variant="outline" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </Button>
                <Input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share photos and memories of {person.given_name || person.full_name}
              </p>
            </div>
          ) : (
            (() => {
              // Group photos by story_id
              const photoGroups = photos.reduce((acc, photo) => {
                const storyId = photo.story_id
                if (!acc[storyId]) {
                  acc[storyId] = []
                }
                acc[storyId].push(photo)
                return acc
              }, {} as Record<string, MemoryPhoto[]>)
              
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.values(photoGroups).map((groupPhotos) => {
                    const primaryPhoto = groupPhotos[0]
                    const additionalCount = groupPhotos.length - 1
                    
                    return (
                      <div 
                        key={primaryPhoto.id} 
                        className="group relative" 
                      >
                        <div 
                          className="aspect-square bg-muted rounded-lg overflow-hidden relative cursor-pointer"
                          onClick={() => openLightbox(photos.indexOf(primaryPhoto))}
                          onMouseEnter={() => setHoveredPhotoId(primaryPhoto.id)}
                          onMouseLeave={() => setHoveredPhotoId(null)}
                        >
                          {photoUrls[primaryPhoto.id] ? (
                            <img
                              src={photoUrls[primaryPhoto.id]}
                              alt={primaryPhoto.story?.title || primaryPhoto.file_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted animate-pulse" />
                          )}
                          
                          {/* Face Tags on Hover - Subtle Names Only */}
                          {hoveredPhotoId === primaryPhoto.id && primaryPhoto.face_tags && primaryPhoto.face_tags.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                              {primaryPhoto.face_tags.map((tag) => (
                                <div
                                  key={tag.id}
                                  className="absolute"
                                  style={{
                                    left: `${tag.x_percent + tag.width_percent / 2}%`,
                                    top: `${tag.y_percent}%`,
                                    transform: 'translateX(-50%)',
                                  }}
                                >
                                  {/* Subtle Name Label */}
                                  <div className="bg-black/75 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-200">
                                    {tag.person_name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Photo count overlay */}
                          {additionalCount > 0 && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
                              +{additionalCount}
                            </div>
                          )}

                          {/* Add more photos button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddPhotosToStory(primaryPhoto.story_id!)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="mt-2">
                          {primaryPhoto.story?.title && (
                            <p className="text-sm font-medium truncate">
                              {primaryPhoto.story.title}
                            </p>
                          )}
                          {primaryPhoto.story?.occurred_on && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(primaryPhoto.story.occurred_on), 'MMM d, yyyy')}
                            </p>
                          )}
                          {primaryPhoto.story?.content && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {primaryPhoto.story.content}
                            </p>
                          )}
                          {additionalCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {groupPhotos.length} photo{groupPhotos.length > 1 ? 's' : ''} in this memory
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          )}
        </CardContent>
      </Card>

      {/* Upload Modal with Story Details */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Memory Photos</DialogTitle>
            <DialogDescription>
              Share photos and tell the story behind this memory.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedFiles.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {selectedFiles.slice(0, 3).map((file, index) => (
                    <span key={index} className="text-xs bg-background px-2 py-1 rounded truncate max-w-32">
                      {file.name}
                    </span>
                  ))}
                  {selectedFiles.length > 3 && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      +{selectedFiles.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                What's this memory about? <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                placeholder="e.g., Family vacation at the beach, Christmas morning 1995..."
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                When was this taken? <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  placeholder="Select exact date"
                />
                <div className="text-xs text-muted-foreground">
                  Or enter approximate date:
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Month (1-12)"
                    type="number"
                    min="1"
                    max="12"
                    className="flex-1"
                    value={approxMonth}
                    onChange={(e) => setApproxMonth(e.target.value)}
                  />
                  <Input
                    placeholder="Year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="flex-1"
                    value={approxYear}
                    onChange={(e) => setApproxYear(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Tell us more about this memory <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                placeholder="Share the story behind these photos - where you were, what was happening, who was there..."
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {photoDescription.length}/1000 characters
              </p>
            </div>

            {/* People Tagging Section */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Who was in these photos? <span className="text-muted-foreground">(optional)</span>
              </label>
              
              {/* Selected People Tags */}
              {taggedPeople.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {taggedPeople.map((personId) => {
                    const person = familyMembers.find(m => m.id === personId)
                    if (!person) return null
                    return (
                      <span 
                        key={personId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                      >
                        {person.full_name}
                        <button
                          type="button"
                          onClick={() => setTaggedPeople(prev => prev.filter(id => id !== personId))}
                          className="hover:bg-primary/20 rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              
              {/* People Search */}
              <div className="relative">
                <Input
                  placeholder="Search for family members or add new..."
                  value={peopleSearchQuery}
                  onChange={(e) => {
                    setPeopleSearchQuery(e.target.value)
                    setShowPeopleDropdown(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowPeopleDropdown(peopleSearchQuery.length > 0)}
                  className="pr-10"
                />
                
                {/* Search Results Dropdown */}
                {showPeopleDropdown && peopleSearchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {(() => {
                      const searchLower = peopleSearchQuery.toLowerCase()
                      const matchingMembers = familyMembers.filter(member => 
                        member.full_name.toLowerCase().includes(searchLower) &&
                        !taggedPeople.includes(member.id)
                      )
                      
                      return (
                        <>
                          {/* Existing Family Members */}
                          {matchingMembers.map(member => (
                            <button
                              key={member.id}
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                              onClick={() => {
                                setTaggedPeople(prev => [...prev, member.id])
                                setPeopleSearchQuery('')
                                setShowPeopleDropdown(false)
                              }}
                            >
                              <span>{member.full_name}</span>
                            </button>
                          ))}
                          
                           {/* Add New Person Option */}
                           {matchingMembers.length === 0 && peopleSearchQuery.trim() && (
                             <div className="border-t pt-2">
                               <button
                                 type="button"
                                 className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-muted-foreground"
                                 onClick={async () => {
                                   const newName = peopleSearchQuery.trim()
                                   if (!newName) return
                                   
                                   try {
                                     const { data: { user } } = await supabase.auth.getUser()
                                     if (!user) return
                                     
                                     const { data: newPerson, error } = await supabase
                                       .from('people')
                                       .insert({
                                         full_name: newName,
                                         family_id: (person as any).family_id,
                                         created_by: user.id,
                                         person_type: 'reference'
                                       })
                                       .select()
                                       .single()
                                       
                                     if (error) throw error
                                     
                                     const newMember = { id: newPerson.id, full_name: newPerson.full_name }
                                     setFamilyMembers(prev => [...prev, newMember])
                                     setTaggedPeople(prev => [...prev, newPerson.id])
                                     setPeopleSearchQuery('')
                                     setShowPeopleDropdown(false)
                                     
                                     toast({
                                       title: "Person added",
                                       description: `${newName} has been added as a reference (won't appear in family tree).`
                                     })
                                   } catch (error) {
                                     console.error('Failed to add person:', error)
                                     toast({
                                       title: "Failed to add person",
                                       description: "Could not add the person. Please try again.",
                                       variant: "destructive"
                                     })
                                   }
                                 }}
                               >
                                 <Plus className="h-4 w-4" />
                                 <span>Add "{peopleSearchQuery.trim()}" as reference</span>
                               </button>
                               <p className="px-3 py-1 text-xs text-muted-foreground">
                                 This won't add them to your family tree
                               </p>
                             </div>
                           )}
                          
                          {matchingMembers.length === 0 && !peopleSearchQuery.trim() && (
                            <div className="px-3 py-2 text-muted-foreground text-sm">
                              Type a name to search...
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
                
                {/* Close dropdown when clicking outside */}
                {showPeopleDropdown && (
                  <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowPeopleDropdown(false)}
                  />
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadModal(false)
                setSelectedFiles([])
                setPhotoTitle('')
                setPhotoDescription('')
                setPhotoDate('')
                setApproxMonth('')
                setApproxYear('')
                setTaggedPeople([person.id])
                setPeopleSearchQuery('')
                setShowPeopleDropdown(false)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadWithStory}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? 'Uploading...' : 'Share Memory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0 overflow-hidden">
          {currentPhoto && (
            <div className="flex flex-col h-full">
              {/* Photo Display Area */}
              <div className="relative h-[60vh] bg-black overflow-hidden z-0">
                <div 
                  className="relative w-full h-full cursor-crosshair"
                  onMouseDown={handlePhotoMouseDown}
                  onMouseMove={handlePhotoMouseMove}
                  onMouseUp={handlePhotoMouseUp}
                >
                  {photoUrls[currentPhoto.id] && (
                    <img
                      src={photoUrls[currentPhoto.id]}
                      alt={currentPhoto.story?.title || currentPhoto.file_name}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  )}
                  
                  {/* Existing Face Tags - Subtle Hover Areas */}
                  {faceTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="absolute group"
                      style={{
                        left: `${tag.x_percent}%`,
                        top: `${tag.y_percent}%`,
                        width: `${tag.width_percent}%`,
                        height: `${tag.height_percent}%`,
                      }}
                    >
                      {/* Invisible hover area */}
                      <div className="absolute inset-0 cursor-pointer" />
                      
                      {/* Subtle Name Label - appears on hover */}
                      <div 
                        className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full mb-1 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10"
                      >
                        {tag.person_name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFaceTag(tag.id, currentPhoto.id)
                          }}
                          className="ml-2 text-white/80 hover:text-white text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Drawing Tag */}
                  {currentTag && (
                    <div
                      className="absolute border-2 border-yellow-400 bg-yellow-400/20"
                      style={{
                        left: `${currentTag.x}%`,
                        top: `${currentTag.y}%`,
                        width: `${currentTag.width}%`,
                        height: `${currentTag.height}%`,
                      }}
                    />
                  )}
                </div>
                
                {/* Navigation Buttons */}
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                      onClick={navigatePrevious}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                      onClick={navigateNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Tag Mode Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-4 left-16 ${isTaggingMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-black/20 hover:bg-black/40'} text-white`}
                  onClick={() => setIsTaggingMode(!isTaggingMode)}
                >
                  <Tag className="h-5 w-5" />
                </Button>

                {/* Delete Photo Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => handleDeletePhoto(currentPhoto.id)}
                >
                  <Trash2 className="h-6 w-6" />
                </Button>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => setShowLightbox(false)}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Photo Counter */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white px-3 py-1 rounded-full text-sm">
                    {currentPhotoIndex + 1} of {photos.length}
                  </div>
                )}

                {/* Tagging Instructions */}
                {isTaggingMode && (
                  <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded text-sm">
                    Click and drag to tag faces
                  </div>
                )}
              </div>

              {/* Inline Story Editor */}
              <div className="flex-1 overflow-y-auto relative z-10 pointer-events-auto">
                <div className="p-6 bg-background border-t">
                  <div className="space-y-4 max-w-2xl">
                    {/* Group Story (Read-only display) */}
                    {currentPhoto.story && (
                      <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-muted-foreground/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Group Story</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStory(currentPhoto.story)}
                            className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <h5 className="font-medium text-sm mb-1">{currentPhoto.story.title}</h5>
                        {currentPhoto.story.content && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {currentPhoto.story.content}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Individual Story Editor */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-medium">
                          {currentPhoto.story ? 'Your story about this photo' : 'Tell the story'}
                        </h4>
                        {isSaving && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                            Saving...
                          </span>
                        )}
                      </div>

                      {/* Story Title */}
                      <div>
                        <Input
                          placeholder="Story title..."
                          value={inlineStoryTitle}
                          onChange={(e) => handleInlineStoryChange('title', e.target.value)}
                          className="text-base border-0 border-b-2 border-border bg-transparent rounded-none px-0 py-2 focus:border-primary focus:ring-0 font-medium"
                          maxLength={100}
                        />
                      </div>

                      {/* Story Content */}
                      <div>
                        <Textarea
                          placeholder="What happened in this moment? Share your memory..."
                          value={inlineStoryContent}
                          onChange={(e) => handleInlineStoryChange('content', e.target.value)}
                          className="resize-none border-0 bg-transparent px-0 py-2 focus:ring-0 focus:border-0 text-base leading-relaxed min-h-[120px]"
                          maxLength={1000}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {inlineStoryContent.length}/1000 characters
                        </div>
                      </div>

                      {/* Story Date */}
                      <div className="flex items-center gap-3 py-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <Input
                          type="date"
                          value={inlineStoryDate}
                          onChange={(e) => handleInlineStoryChange('date', e.target.value)}
                          className="text-sm border border-border bg-background px-3 py-2 rounded focus:ring-1 focus:ring-primary max-w-[160px]"
                        />
                      </div>

                      {/* Tagged People */}
                      {taggedPeople.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <h5 className="text-sm font-medium mb-3">People in this memory</h5>
                          <div className="flex flex-wrap gap-2">
                            {taggedPeople.map((personId) => {
                              const taggedPerson = familyMembers.find(m => m.id === personId)
                              if (!taggedPerson) return null
                              return (
                                <span 
                                  key={personId}
                                  className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium"
                                >
                                  {taggedPerson.full_name}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Story Modal */}
      <Dialog open={showEditStoryModal} onOpenChange={setShowEditStoryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStory ? 'Edit Memory Story' : 'Add Story to Photo'}</DialogTitle>
            <DialogDescription>
              {editingStory ? 'Update the details of this memory story.' : 'Tell a quick story about this photo.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Story Title
              </label>
              <Input
                placeholder="Enter story title..."
                value={editStoryTitle}
                onChange={(e) => setEditStoryTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Date
              </label>
              <Input
                type="date"
                value={editStoryDate}
                onChange={(e) => setEditStoryDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Story Description
              </label>
              <Textarea
                placeholder="Tell the story behind this memory..."
                value={editStoryContent}
                onChange={(e) => setEditStoryContent(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editStoryContent.length}/1000 characters
              </p>
            </div>

            {/* People Tagging Section */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Who's in this memory?
              </label>
              
              {/* Selected People Tags */}
              {taggedPeople.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {taggedPeople.map((personId) => {
                    const person = familyMembers.find(m => m.id === personId)
                    if (!person) return null
                    return (
                      <span 
                        key={personId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                      >
                        {person.full_name}
                        <button
                          type="button"
                          onClick={() => setTaggedPeople(prev => prev.filter(id => id !== personId))}
                          className="hover:bg-primary/20 rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              
              {/* People Search */}
              <div className="relative">
                <Input
                  placeholder="Search for family members to tag..."
                  value={peopleSearchQuery}
                  onChange={(e) => {
                    setPeopleSearchQuery(e.target.value)
                    setShowPeopleDropdown(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowPeopleDropdown(peopleSearchQuery.length > 0)}
                  className="pr-10"
                />
                
                {/* Search Results Dropdown */}
                {showPeopleDropdown && peopleSearchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {(() => {
                      const searchLower = peopleSearchQuery.toLowerCase()
                      const matchingMembers = familyMembers.filter(member => 
                        member.full_name.toLowerCase().includes(searchLower) &&
                        !taggedPeople.includes(member.id)
                      )
                      
                      return (
                        <>
                          {/* Existing Family Members */}
                          {matchingMembers.map(member => (
                            <button
                              key={member.id}
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                              onClick={() => {
                                setTaggedPeople(prev => [...prev, member.id])
                                setPeopleSearchQuery('')
                                setShowPeopleDropdown(false)
                              }}
                            >
                              <span>{member.full_name}</span>
                            </button>
                          ))}
                           
                           {matchingMembers.length === 0 && peopleSearchQuery.trim() && (
                             <div className="px-3 py-2 text-muted-foreground text-sm">
                               No matching family members found
                             </div>
                           )}
                        </>
                      )
                    })()}
                  </div>
                )}
                
                {/* Close dropdown when clicking outside */}
                {showPeopleDropdown && (
                  <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowPeopleDropdown(false)}
                  />
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditStoryModal(false)
                setIsCreatingStory(false)
                setCurrentPhotoForStory(null)
                setEditingStory(null)
                setEditStoryTitle('')
                setEditStoryContent('')
                setEditStoryDate('')
                setTaggedPeople([person.id])
                setPeopleSearchQuery('')
                setShowPeopleDropdown(false)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={isCreatingStory ? handleCreateStory : handleUpdateStory}
              disabled={!editStoryTitle.trim()}
            >
              {isCreatingStory ? 'Add Story' : 'Update Story'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Person Modal */}
      <Dialog open={showTagPersonModal} onOpenChange={() => !showTagPersonModal ? null : cancelTagging()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tag Person</DialogTitle>
            <DialogDescription>
              Who is in this selected area?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="person-select">Select Person</Label>
              <div className="relative">
                <select
                  id="person-select"
                  value={selectedPersonForTag}
                  onChange={(e) => setSelectedPersonForTag(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Choose a person...</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={cancelTagging}>
              Cancel
            </Button>
            <Button 
              onClick={handleTagPerson}
              disabled={!selectedPersonForTag}
            >
              Tag Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}