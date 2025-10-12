import { Helmet } from 'react-helmet-async'
import { getPageType } from '@/utils/personUtils'
import { IndexabilityLevel } from '@/hooks/usePersonSEO'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface PersonData {
  id: string
  full_name: string
  given_name?: string
  surname?: string
  birth_date?: string
  death_date?: string
  avatar_url?: string
  bio?: string
  short_bio?: string
  slug?: string
  is_living?: boolean
  status?: 'living' | 'passed'
}

interface PersonPageSEOProps {
  person: PersonData
  indexability: IndexabilityLevel
  ogTitle?: string
  ogDescription?: string
  ogImageUrl?: string
}

export function PersonPageSEO({ 
  person, 
  indexability,
  ogTitle,
  ogDescription,
  ogImageUrl 
}: PersonPageSEOProps) {
  const isMemorial = Boolean(person.death_date || person.is_living === false || person.status === 'passed')
  
  // Fetch surviving relatives for schema.org obituary
  const { data: relationships } = useQuery({
    queryKey: ['person-relationships-seo', person.id],
    queryFn: async () => {
      if (!isMemorial || indexability !== 'public_indexable') return []
      
      const { data, error } = await supabase
        .from('relationships')
        .select(`
          to_person_id,
          relationship_type,
          people!relationships_to_person_id_fkey(
            id,
            full_name,
            status
          )
        `)
        .eq('from_person_id', person.id)
        .in('relationship_type', ['spouse', 'child', 'sibling'])
      
      if (error) {
        console.error('Error fetching relationships for SEO:', error)
        return []
      }
      
      // Filter to living relatives only
      return data?.filter(rel => 
        rel.people && 
        (rel.people as any).status === 'living'
      ) || []
    },
    enabled: isMemorial && indexability === 'public_indexable'
  })
  
  // Use short_bio for SEO description when public_indexable, fallback to defaults
  const defaultDescription = isMemorial 
    ? `Remembering ${person.full_name}. Share memories and celebrate their life.`
    : `Explore the life story of ${person.full_name}.`
  
  // For public_indexable pages, prefer short_bio (required for SEO)
  const seoDescription = indexability === 'public_indexable' && person.short_bio
    ? person.short_bio
    : (person.bio || defaultDescription)
  
  const title = ogTitle || `${person.full_name} | ${isMemorial ? 'In Memory' : 'Life Page'}`
  const description = ogDescription || seoDescription
  
  const imageUrl = ogImageUrl || person.avatar_url
  const canonicalUrl = person.slug ? `${window.location.origin}/p/${person.slug}` : window.location.href
  
  // Determine robots meta tag
  const robotsContent = indexability === 'private' || indexability === 'unlisted' 
    ? 'noindex,nofollow' 
    : 'index,follow'
  
  // Only include OG tags for public indexable pages
  const includeOGTags = indexability === 'public_indexable'
  
  // Structured data for schema.org
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.full_name,
    givenName: person.given_name,
    familyName: person.surname,
    ...(person.birth_date && { birthDate: person.birth_date }),
    ...(imageUrl && { image: imageUrl }),
    ...(person.bio && { description: person.bio })
  }
  
  // Build survivingPerson array for obituary schema
  const survivingRelatives = relationships?.map(rel => ({
    '@type': 'Person',
    name: (rel.people as any)?.full_name,
    relatedTo: person.full_name
  })) || []
  
  const obituarySchema = isMemorial && person.death_date ? {
    '@context': 'https://schema.org',
    '@type': 'Obituary',
    about: personSchema,
    datePublished: person.death_date,
    ...(person.death_date && { deathDate: person.death_date }),
    ...(survivingRelatives.length > 0 && { survivingPerson: survivingRelatives })
  } : null

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />
      
      {includeOGTags && (
        <>
          {/* Open Graph tags */}
          <meta property="og:type" content="profile" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={canonicalUrl} />
          {imageUrl && <meta property="og:image" content={imageUrl} />}
          {person.given_name && <meta property="profile:first_name" content={person.given_name} />}
          {person.surname && <meta property="profile:last_name" content={person.surname} />}
          
          {/* Twitter Card tags */}
          <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        </>
      )}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(obituarySchema || personSchema)}
      </script>
    </Helmet>
  )
}
