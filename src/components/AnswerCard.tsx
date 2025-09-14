import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ReactionBar from './ReactionBar'
import CommentThread from './CommentThread'
import type { Answer, Profile, Question, Media } from '@/lib/types'

interface AnswerCardProps {
  answer: Answer & { profiles: Profile; questions: Question }
}

export default function AnswerCard({ answer }: AnswerCardProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  useEffect(() => {
    const getMedia = async () => {
      const { data } = await supabase
        .from('media')
        .select('*')
        .eq('answer_id', answer.id)
        .order('created_at')

      if (data) {
        setMedia(data)
        
        // Get signed URLs for media
        const urls = await Promise.all(
          data.map(async (item) => {
            const { data: { signedUrl } } = await supabase.storage
              .from('media')
              .createSignedUrl(item.file_path, 3600)
            return signedUrl || ''
          })
        )
        setMediaUrls(urls.filter(Boolean))
      }
    }

    getMedia()
  }, [answer.id])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={answer.profiles.avatar_url || ''} />
            <AvatarFallback>
              {answer.profiles.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {answer.questions.question_text}
            </CardTitle>
            <CardDescription>
              answered by {answer.profiles.full_name || 'User'} • {' '}
              {new Date(answer.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{answer.answer_text}</p>
        </div>

        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mediaUrls.map((url, index) => {
              const mediaItem = media[index]
              if (mediaItem?.mime_type.startsWith('image/')) {
                return (
                  <img
                    key={index}
                    src={url}
                    alt={mediaItem.file_name}
                    className="rounded-lg max-h-64 object-cover w-full"
                  />
                )
              } else if (mediaItem?.mime_type.startsWith('video/')) {
                return (
                  <video
                    key={index}
                    src={url}
                    controls
                    className="rounded-lg max-h-64 w-full"
                  />
                )
              }
              return null
            })}
          </div>
        )}

        <ReactionBar 
          targetType="answer" 
          targetId={answer.id}
          familyId={answer.family_id}
        />
        
        <CommentThread 
          targetType="answer" 
          targetId={answer.id}
          familyId={answer.family_id}
        />
      </CardContent>
    </Card>
  )
}