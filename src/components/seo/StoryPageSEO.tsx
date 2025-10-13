import { Helmet } from 'react-helmet-async'
import { useMemo } from 'react'

interface StoryPageSEOProps {
  story: {
    id: string
    title: string
    content: string
    privacy: 'private' | 'link' | 'public'
    created_at: string
    profiles?: {
      full_name: string
    }
  }
  ogImage?: string | null
  familyName?: string
}

export function StoryPageSEO({ story, ogImage, familyName }: StoryPageSEOProps) {
  const { metaTags, robotsContent } = useMemo(() => {
    const isPublic = story.privacy === 'public'
    const isLink = story.privacy === 'link'
    
    // Extract plain text content (no PII)
    const description = story.content
      ? story.content.substring(0, 160).trim() + (story.content.length > 160 ? '...' : '')
      : `A family story titled "${story.title}"`
    
    const authorName = story.profiles?.full_name || 'Family member'
    const pageTitle = `${story.title} | ${familyName || 'Family Stories'}`
    
    // Robots meta based on privacy
    let robots = 'noindex, nofollow'
    if (isPublic) {
      robots = 'index, follow'
    } else if (isLink) {
      robots = 'noindex, follow'
    }
    
    const tags = {
      // Basic meta
      title: pageTitle,
      description: isPublic ? description : 'A private family story',
      
      // Open Graph (for social sharing)
      ogTitle: isPublic ? story.title : 'Private Family Story',
      ogDescription: isPublic ? description : 'This story is private and requires authentication to view',
      ogType: 'article',
      ogImage: ogImage || '/og-default.png',
      
      // Twitter Card
      twitterCard: 'summary_large_image',
      twitterTitle: isPublic ? story.title : 'Private Family Story',
      twitterDescription: isPublic ? description : 'This story is private',
      
      // Article meta (only for public)
      articleAuthor: isPublic ? authorName : undefined,
      articlePublishedTime: isPublic ? story.created_at : undefined,
    }
    
    return {
      metaTags: tags,
      robotsContent: robots
    }
  }, [story, ogImage, familyName])

  return (
    <Helmet>
      {/* Basic meta */}
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      
      {/* Robots */}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      
      {/* Open Graph */}
      <meta property="og:title" content={metaTags.ogTitle} />
      <meta property="og:description" content={metaTags.ogDescription} />
      <meta property="og:type" content={metaTags.ogType} />
      {metaTags.ogImage && <meta property="og:image" content={metaTags.ogImage} />}
      <meta property="og:url" content={window.location.href} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={metaTags.twitterCard} />
      <meta name="twitter:title" content={metaTags.twitterTitle} />
      <meta name="twitter:description" content={metaTags.twitterDescription} />
      {metaTags.ogImage && <meta name="twitter:image" content={metaTags.ogImage} />}
      
      {/* Article meta (only for public stories) */}
      {metaTags.articleAuthor && (
        <>
          <meta property="article:author" content={metaTags.articleAuthor} />
          <meta property="article:published_time" content={metaTags.articlePublishedTime} />
        </>
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={window.location.href} />
    </Helmet>
  )
}
