import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Person } from '@/utils/personUtils'

interface PersonSEOProps {
  person: Person
  visibility: string
  indexability: string
  preset: 'life' | 'tribute'
}

export function usePersonSEOMeta({ person, visibility, indexability, preset }: PersonSEOProps) {
  const shouldIndex = visibility === 'public' && indexability === 'indexable'
  
  const robotsMeta = useMemo(() => {
    if (!shouldIndex) {
      return 'noindex,nofollow'
    }
    return 'index,follow'
  }, [shouldIndex])

  const fullName = `${person.given_name} ${person.surname || ''}`.trim()
  const pageTitle = preset === 'tribute' 
    ? `${fullName} - In Loving Memory`
    : `${fullName} - Life Story`

  const pageDescription = person.birth_date
    ? `${fullName}, born ${new Date(person.birth_date).toLocaleDateString()}`
    : fullName

  // Schema.org structured data
  const structuredData = useMemo(() => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: fullName,
      givenName: person.given_name,
      familyName: person.surname,
      ...(person.birth_date && {
        birthDate: person.birth_date,
      }),
      ...(person.gender && {
        gender: person.gender,
      }),
      ...(person.alt_names && person.alt_names.length > 0 && {
        alternateName: person.alt_names,
      }),
    }

    // Add Obituary schema for tribute pages
    if (preset === 'tribute' && person.death_date) {
      const personWithPlace = person as any
      return {
        '@context': 'https://schema.org',
        '@type': 'Obituary',
        name: `Obituary for ${fullName}`,
        mainEntity: {
          ...baseSchema,
          deathDate: person.death_date,
          ...(personWithPlace.birth_place && {
            birthPlace: {
              '@type': 'Place',
              name: personWithPlace.birth_place,
            },
          }),
          ...(personWithPlace.death_place && {
            deathPlace: {
              '@type': 'Place',
              name: personWithPlace.death_place,
            },
          }),
        },
      }
    }

    return baseSchema
  }, [person, preset, fullName])

  const SEOHelmet = () => (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robotsMeta} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={window.location.href} />
      
      {/* Structured Data */}
      {shouldIndex && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )

  return {
    SEOHelmet,
    shouldIndex,
    structuredData,
    robotsMeta
  }
}
