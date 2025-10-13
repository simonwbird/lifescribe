import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { User, Edit, X, Plus, ExternalLink } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { supabase } from '@/integrations/supabase/client'
import { useDraftManager } from '@/hooks/useDraftManager'
import { AutosaveIndicator } from '@/components/story-wizard/AutosaveIndicator'

interface Link {
  label: string
  url: string
}

interface AboutMeBlockProps {
  personId: string
  familyId: string
  blockContent: {
    bio?: string
    pronouns?: string
    nicknames?: string[]
    links?: Link[]
  }
  canEdit: boolean
  onUpdate?: () => void
}

export default function AboutMeBlock({
  personId,
  familyId,
  blockContent,
  canEdit,
  onUpdate
}: AboutMeBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(blockContent.bio || '')
  const [pronouns, setPronouns] = useState(blockContent.pronouns || '')
  const [nicknames, setNicknames] = useState<string[]>(blockContent.nicknames || [])
  const [links, setLinks] = useState<Link[]>(blockContent.links || [])
  const [newNickname, setNewNickname] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  
  const { autosaveStatus, startAutosave, stopAutosave } = useDraftManager(`about-me-${personId}`)

  const saveToDatabase = useCallback(async () => {
    try {
      const { data: blocks, error: fetchError } = await supabase
        .from('person_page_blocks')
        .select('id')
        .eq('person_id', personId)
        .eq('type', 'about_me')
        .single()

      if (fetchError) throw fetchError

      const { error: updateError } = await supabase
        .from('person_page_blocks')
        .update({
          content_json: {
            bio,
            pronouns,
            nicknames,
            links
          } as any
        })
        .eq('id', blocks.id)

      if (updateError) throw updateError

      onUpdate?.()
    } catch (error) {
      console.error('Error saving About Me:', error)
      throw error
    }
  }, [bio, pronouns, nicknames, links, personId, onUpdate])

  useEffect(() => {
    if (isEditing) {
      startAutosave(() => ({
        content: { bio, pronouns, nicknames, links }
      }))
      
      const saveInterval = setInterval(() => {
        saveToDatabase().catch(console.error)
      }, 3000)

      return () => {
        clearInterval(saveInterval)
        stopAutosave()
      }
    }
  }, [isEditing, bio, pronouns, nicknames, links, startAutosave, stopAutosave, saveToDatabase])

  const addNickname = () => {
    if (newNickname.trim()) {
      setNicknames([...nicknames, newNickname.trim()])
      setNewNickname('')
    }
  }

  const removeNickname = (index: number) => {
    setNicknames(nicknames.filter((_, i) => i !== index))
  }

  const addLink = () => {
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      setLinks([...links, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }])
      setNewLinkLabel('')
      setNewLinkUrl('')
    }
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  if (!isEditing && !bio && !pronouns && nicknames.length === 0 && links.length === 0) {
    if (!canEdit) return null
    
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">Add an About Me section</p>
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add About Me
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="about-me" className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              About Me
            </CardTitle>
            {isEditing && <AutosaveIndicator status={autosaveStatus} />}
          </div>
          {canEdit && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canEdit && isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Done
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          <>
            {/* Bio Editor */}
            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief bio... (supports markdown)"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports markdown formatting
              </p>
            </div>

            {/* Pronouns Editor */}
            <div>
              <label className="text-sm font-medium mb-2 block">Pronouns</label>
              <Input
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="she/her, he/him, they/them, etc."
              />
            </div>

            {/* Nicknames Editor */}
            <div>
              <label className="text-sm font-medium mb-2 block">Nicknames</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {nicknames.map((nickname, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {nickname}
                      <button
                        onClick={() => removeNickname(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Add a nickname"
                    onKeyPress={(e) => e.key === 'Enter' && addNickname()}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addNickname}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Links Editor */}
            <div>
              <label className="text-sm font-medium mb-2 block">Links</label>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{link.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="space-y-2">
                  <Input
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    placeholder="Link label (e.g., 'My Website')"
                  />
                  <Input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="URL (e.g., 'https://example.com')"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addLink} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
              </div>
            </div>

          </>
        ) : (
          <>
            {/* Bio Display */}
            {bio && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{bio}</ReactMarkdown>
              </div>
            )}

            {/* Pronouns Display */}
            {pronouns && (
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Pronouns:</span> {pronouns}
                </p>
              </div>
            )}

            {/* Nicknames Display */}
            {nicknames.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Also known as:</p>
                <div className="flex flex-wrap gap-2">
                  {nicknames.map((nickname, index) => (
                    <Badge key={index} variant="secondary">
                      {nickname}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Links Display */}
            {links.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Links:</p>
                <div className="flex flex-col gap-2">
                  {links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
