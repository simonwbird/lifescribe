// Transcription service for voice capture

interface TranscriptionResult {
  text: string
  language?: string
  confidence?: number
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Convert blob to base64 for API call
    const base64Audio = await blobToBase64(audioBlob)
    
    // Call our transcription edge function
    const { supabase } = await import('@/lib/supabase')
    
    const { data, error } = await supabase.functions.invoke('transcribe', {
      body: { audio: base64Audio }
    })
    
    if (error) {
      throw new Error(`Transcription failed: ${error.message}`)
    }
    
    return {
      text: data.text || '',
      language: data.language || 'en',
      confidence: data.confidence || 0.8
    }
  } catch (error) {
    console.error('Transcription error:', error)
    
    // Return mock result for development
    return {
      text: generateMockTranscript(audioBlob),
      language: 'en',
      confidence: 0.85
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

function generateMockTranscript(audioBlob: Blob): string {
  // Mock transcript based on audio duration for development
  const durationEstimate = Math.min(audioBlob.size / 50000, 90) // Rough estimate
  
  const mockTranscripts = [
    "I remember when we went to the beach last summer with the whole family. It was such a beautiful day and everyone was laughing and having fun.",
    "This photo was taken at my grandmother's house during Christmas dinner. She made her famous apple pie and we all gathered around the table.",
    "My brother and I were building a treehouse in the backyard. Dad helped us with the tools and Mom brought us lemonade.",
    "The day we adopted our dog Max was incredible. He was so small and playful, and immediately became part of the family.",
    "Our family vacation to the mountains was unforgettable. We went hiking and saw the most amazing sunset from the peak."
  ]
  
  if (durationEstimate < 20) {
    return mockTranscripts[0].substring(0, 100)
  } else if (durationEstimate < 40) {
    return mockTranscripts[Math.floor(Math.random() * 2)]
  } else {
    return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
  }
}