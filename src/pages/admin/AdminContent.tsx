import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, FileText, Image, Video, Mic } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

interface ContentItem {
  id: string
  title: string
  content?: string
  type: 'story' | 'answer' | 'media'
  author: string
  family: string
  created_at: string
  tags?: string[]
  mime_type?: string
}

export default function AdminContent() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      
      // Fetch stories
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          tags,
          created_at,
          profiles!stories_profile_id_fkey (full_name, email),
          families!stories_family_id_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      // Fetch answers
      const { data: answers } = await supabase
        .from('answers')
        .select(`
          id,
          answer_text,
          created_at,
          profiles!answers_profile_id_fkey (full_name, email),
          families!answers_family_id_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      // Fetch media
      const { data: media } = await supabase
        .from('media')
        .select(`
          id,
          file_name,
          mime_type,
          created_at,
          profiles!media_profile_id_fkey (full_name, email),
          families!media_family_id_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      const allContent: ContentItem[] = [
        ...(stories || []).map(story => ({
          id: story.id,
          title: story.title,
          content: story.content,
          type: 'story' as const,
          author: story.profiles?.full_name || story.profiles?.email || 'Unknown',
          family: story.families?.name || 'Unknown',
          created_at: story.created_at,
          tags: story.tags
        })),
        ...(answers || []).map(answer => ({
          id: answer.id,
          title: answer.answer_text.substring(0, 50) + '...',
          content: answer.answer_text,
          type: 'answer' as const,
          author: answer.profiles?.full_name || answer.profiles?.email || 'Unknown',
          family: answer.families?.name || 'Unknown',
          created_at: answer.created_at
        })),
        ...(media || []).map(item => ({
          id: item.id,
          title: item.file_name,
          type: 'media' as const,
          author: item.profiles?.full_name || item.profiles?.email || 'Unknown',
          family: item.families?.name || 'Unknown',
          created_at: item.created_at,
          mime_type: item.mime_type
        }))
      ]

      // Sort all content by creation date
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setContent(allContent)
    } catch (error) {
      console.error('Failed to fetch content:', error)
    } finally {
      setLoading(false)
    }
  }

  const getContentIcon = (item: ContentItem) => {
    if (item.type === 'story') return FileText
    if (item.type === 'answer') return FileText
    if (item.mime_type?.startsWith('image/')) return Image
    if (item.mime_type?.startsWith('video/')) return Video
    if (item.mime_type?.startsWith('audio/')) return Mic
    return FileText
  }

  const getContentColor = (item: ContentItem) => {
    if (item.type === 'story') return 'text-blue-600'
    if (item.type === 'answer') return 'text-green-600'
    if (item.mime_type?.startsWith('image/')) return 'text-purple-600'
    if (item.mime_type?.startsWith('video/')) return 'text-red-600'
    if (item.mime_type?.startsWith('audio/')) return 'text-orange-600'
    return 'text-gray-600'
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.family.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterType === 'all' || item.type === filterType

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content & Media</h1>
        <p className="text-muted-foreground">
          Browse and manage all platform content
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="story">Stories</SelectItem>
            <SelectItem value="answer">Answers</SelectItem>
            <SelectItem value="media">Media Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent.map((item) => {
          const Icon = getContentIcon(item)
          const iconColor = getContentColor(item)
          
          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Icon className={`h-4 w-4 ${iconColor} flex-shrink-0`} />
                    <CardTitle className="text-sm truncate">
                      {item.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs ml-2">
                    {item.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {item.content && (
                  <div>
                    <p className="text-xs text-muted-foreground">Content Preview</p>
                    <p className="text-sm line-clamp-2">{item.content.substring(0, 100)}...</p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-muted-foreground">Author</p>
                  <p className="text-sm">{item.author}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Family</p>
                  <p className="text-sm">{item.family}</p>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">{formatForUser(item.created_at, 'datetime', getCurrentUserRegion())}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No content found matching your criteria
          </p>
        </div>
      )}
    </div>
  )
}