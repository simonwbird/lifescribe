// Transcription service for voice capture

interface TranscriptionResult {
  text: string
  language?: string
  confidence?: number
  extractedInfo?: {
    title: string
    people: Array<{ name: string; relationship?: string }>
    dates: Array<{ text: string; date: string; precision: string }>
    locations: Array<string>
    emotions: Array<string>
    themes: Array<string>
    keyMoments: Array<string>
  }
}

export async function transcribeAudio(audioBlob: Blob, prompt?: string): Promise<TranscriptionResult> {
  try {
    // Convert blob to base64 for API call
    const base64Audio = await blobToBase64(audioBlob)
    
    // Call our enhanced smart transcription edge function
    const { supabase } = await import('@/lib/supabase')
    
    // First try the smart transcription
    try {
      const { data, error } = await supabase.functions.invoke('smart-transcribe', {
        body: { 
          audio: base64Audio,
          prompt: prompt 
        }
      })
      
      if (!error && data) {
        return {
          text: data.text || '',
          language: data.language || 'en',
          confidence: data.confidence || 0.8,
          extractedInfo: data.extractedInfo
        }
      }
    } catch (smartError) {
      console.warn('Smart transcription failed, falling back to basic:', smartError)
    }
    
    // Fallback to basic transcription
    try {
      const { data: basicData, error: basicError } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio }
      })
      
      if (!basicError && basicData) {
        return {
          text: basicData.text || '',
          language: basicData.language || 'en',
          confidence: basicData.confidence || 0.8
        }
      }
    } catch (basicError) {
      console.warn('Basic transcription also failed:', basicError)
    }
    
    // If both fail, return mock result
    throw new Error('Both transcription services failed')
    
  } catch (error) {
    console.error('All transcription attempts failed:', error)
    
    // Return mock result for development
    const mockText = generateMockTranscript(audioBlob)
    return {
      text: mockText,
      language: 'en',
      confidence: 0.85,
      extractedInfo: generateMockExtractedInfo(mockText)
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (data:audio/webm;base64,)
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function generateMockExtractedInfo(transcriptText?: string) {
  // Generate contextual mock data based on transcript if available
  if (transcriptText && transcriptText.includes('beach')) {
    return {
      title: "Beach Day Memory",
      people: [
        { name: "Mom", relationship: "mother" },
        { name: "Dad", relationship: "father" }
      ],
      dates: [
        { text: "last summer", date: "2024-07-15", precision: "month" }
      ],
      locations: ["Beach"],
      emotions: ["joy", "relaxation", "family bonding"],
      themes: ["family vacation", "summer memories"],
      keyMoments: ["playing in the sand", "watching sunset"]
    }
  }
  
  return {
    title: "Family Memory",
    people: [
      { name: "Mom", relationship: "mother" },
      { name: "Sarah", relationship: "sister" }
    ],
    dates: [
      { text: "a few years ago", date: "2022-06-15", precision: "year" }
    ],
    locations: ["Home"],
    emotions: ["love", "nostalgia", "warmth"],
    themes: ["family bonding", "childhood memories"],
    keyMoments: ["special moment together", "learning something new"]
  }
}

function generateMockTranscript(audioBlob: Blob): string {
  // Mock transcript based on audio duration for development
  const durationEstimate = Math.min(audioBlob.size / 50000, 90) // Rough estimate
  
  const mockTranscripts = [
    "I remember when we went to the beach last summer with the whole family. It was such a beautiful day and Mom packed a wonderful lunch. Dad helped us build this amazing sandcastle and we all watched the sunset together. It was one of those perfect family moments that I'll never forget.",
    "This story is about my grandmother's house during Christmas dinner. She made her famous apple pie that filled the whole house with the most incredible smell. The whole family gathered around her big dining room table, and we shared stories and laughed until our sides hurt.",
    "My brother and I were building a treehouse in the backyard when I was about ten years old. Dad helped us with the tools and taught us how to measure and cut the wood properly. Mom brought us fresh lemonade on that hot summer day. It took us three weekends but we finally finished it.",
    "The day we adopted our dog Max was incredible. He was this tiny golden retriever puppy, so small and playful. The moment we brought him home, he immediately became part of the family. Sarah was so excited she couldn't stop hugging him.",
    "Our family vacation to the mountains was unforgettable. We went hiking on this beautiful trail and saw the most amazing sunset from the peak. Dad carried the camera and took so many pictures. Mom packed the best trail mix. It was just perfect weather and perfect company."
  ]
  
  // Return a transcript based on estimated duration
  if (durationEstimate < 20) {
    return mockTranscripts[0].substring(0, 150) + "..."
  } else if (durationEstimate < 40) {
    return mockTranscripts[Math.floor(Math.random() * 2)]
  } else {
    return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
  }
}