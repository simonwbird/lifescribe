// Service for uploading voice recordings and creating stories

import { supabase } from '@/integrations/supabase/client'

interface ReviewData {
  title: string
  content: string
  people: Array<{ id?: string; name: string }>
  date: string
  datePrecision: 'day' | 'month' | 'year' | 'unknown'
  privacy: 'family' | 'private'
  tags: string[]
  isDraft?: boolean
}

export async function uploadVoiceRecording(audioBlob: Blob, familyId: string, userId: string): Promise<string> {
  try {
    const timestamp = Date.now()
    const uuid = crypto.randomUUID()
    const fileName = `${timestamp}-${uuid.slice(0, 8)}.webm`
    const filePath = `audio/${familyId}/${userId}/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    return data.path
  } catch (error) {
    console.error('Voice upload error:', error)
    throw error
  }
}

export async function createStoryFromVoice(audioBlob: Blob, reviewData: ReviewData): Promise<string> {
  try {
    // Get current user and family
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data: member } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', user.id)
      .single()
    
    if (!member) throw new Error('User not member of any family')
    
    const familyId = member.family_id
    
    // Upload audio file
    const audioPath = await uploadVoiceRecording(audioBlob, familyId, user.id)
    
    // Parse date based on precision
    let occurredOn: string | null = null
    let occurredPrecision: 'day' | 'month' | 'year' | null = null
    let isApprox = false
    
    if (reviewData.date && reviewData.datePrecision !== 'unknown') {
      occurredOn = reviewData.date
      occurredPrecision = reviewData.datePrecision as 'day' | 'month' | 'year'
      isApprox = reviewData.datePrecision !== 'day'
    }
    
    // Create story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        title: reviewData.title,
        content: reviewData.content,
        family_id: familyId,
        profile_id: user.id,
        occurred_on: occurredOn,
        occurred_precision: occurredPrecision,
        is_approx: isApprox,
        tags: reviewData.tags
      })
      .select()
      .single()
    
    if (storyError) {
      throw new Error(`Story creation failed: ${storyError.message}`)
    }
    
    // Create media record for audio
    const { error: mediaError } = await supabase
      .from('media')
      .insert({
        family_id: familyId,
        profile_id: user.id,
        story_id: story.id,
        file_path: audioPath,
        file_name: `voice-recording-${story.id}.webm`,
        mime_type: 'audio/webm',
        file_size: audioBlob.size
      })
    
    if (mediaError) {
      console.error('Media creation failed:', mediaError)
    }
    
    // Link people to story
    if (reviewData.people.length > 0) {
      const peopleLinks = reviewData.people.map(person => ({
        family_id: familyId,
        story_id: story.id,
        person_id: person.id || null, // Will be null for new people
        // For new people, we'd need to create them first
      })).filter(link => link.person_id) // Only link existing people for now
      
      if (peopleLinks.length > 0) {
        const { error: linkError } = await supabase
          .from('person_story_links')
          .insert(peopleLinks)
        
        if (linkError) {
          console.error('People linking failed:', linkError)
        }
      }
    }
    
    return story.id
  } catch (error) {
    console.error('Story creation error:', error)
    throw error
  }
}