import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Heart, Send } from 'lucide-react'
import { Person, UserRole, canAddContent, canModerate } from '@/utils/personUtils'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface ContributionsProps {
  person: Person
  userRole: UserRole
  pageType: 'life' | 'tribute'
}

interface GuestbookEntry {
  id: string
  body: string
  author_profile_id: string
  created_at: string
  is_hidden: boolean
}

export function Contributions({ person, userRole, pageType }: ContributionsProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  const canUserAddContent = canAddContent(userRole)
  const canUserModerate = canModerate(userRole)
  const title = pageType === 'tribute' ? 'Guestbook' : 'Messages'
  const placeholder = pageType === 'tribute' 
    ? 'Leave a tribute...' 
    : `Leave a message for ${person.given_name}...`

  useEffect(() => {
    fetchEntries()
  }, [person.id])

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select(`
          id,
          body,
          author_profile_id,
          created_at,
          is_hidden
        `)
        .eq('person_id', person.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching guestbook entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newEntry.trim()) return
    
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('guestbook')
        .insert({
          person_id: person.id,
          family_id: person.family_id,
          author_profile_id: user.id,
          body: newEntry.trim()
        })

      if (error) throw error

      setNewEntry('')
      fetchEntries()
      toast({
        title: "Success",
        description: `${pageType === 'tribute' ? 'Tribute' : 'Message'} added successfully`
      })
    } catch (error) {
      console.error('Error adding entry:', error)
      toast({
        title: "Error",
        description: `Failed to add ${pageType === 'tribute' ? 'tribute' : 'message'}`,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHide = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('guestbook')
        .update({ is_hidden: true })
        .eq('id', entryId)

      if (error) throw error
      fetchEntries()
    } catch (error) {
      console.error('Error hiding entry:', error)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {pageType === 'tribute' ? (
            <Heart className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* New entry form */}
        {canUserAddContent && (
          <div className="space-y-3">
            <Textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder={placeholder}
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {newEntry.length}/500 characters
              </span>
              <Button 
                onClick={handleSubmit} 
                disabled={!newEntry.trim() || isSubmitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {pageType === 'tribute' ? 'Leave tribute' : 'Send message'}
              </Button>
            </div>
          </div>
        )}

        {/* Entries list */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Loading...</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              {pageType === 'tribute' ? (
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              ) : (
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              )}
              <p className="text-muted-foreground">
                {pageType === 'tribute' 
                  ? 'No tributes yet—add a first tribute.'
                  : 'No messages yet—start the conversation.'
                }
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-xs">
                    AU
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Anonymous User
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </span>
                      {canUserModerate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHide(entry.id)}
                          className="text-xs h-6"
                        >
                          Hide
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {entry.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}