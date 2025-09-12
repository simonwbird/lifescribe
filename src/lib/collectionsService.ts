import { supabase } from '@/lib/supabase'
import { MediaService } from './mediaService'
import cookiesImg from '@/assets/grandma-cookies.jpg'
import potRoastImg from '@/assets/sunday-pot-roast.jpg'
import applePieImg from '@/assets/moms-apple-pie.jpg'
import ribsImg from '@/assets/bbq-ribs.jpg'
import type { 
  Content, 
  ContentFilter, 
  ContentSort, 
  ContentCounts,
  StoryContent,
  RecipeContent,
  ObjectContent,
  PropertyContent
} from './collectionsTypes'

const sampleRecipeImageForTitle = (title: string): string | null => {
  const t = title.toLowerCase()
  if (t.includes('cookie')) return cookiesImg
  if (t.includes('pot roast')) return potRoastImg
  if (t.includes('apple pie')) return applePieImg
  if (t.includes('ribs')) return ribsImg
  return null
}

export class CollectionsService {
  static async getContentCounts(familyId: string): Promise<ContentCounts> {
    const [storiesResult, recipesResult, objectsResult, propertiesResult] = await Promise.all([
      supabase.from('stories').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('recipes').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('things').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('properties').select('id', { count: 'exact' }).eq('family_id', familyId)
    ])

    const stories = storiesResult.count || 0
    const recipes = recipesResult.count || 0
    const objects = objectsResult.count || 0
    const properties = propertiesResult.count || 0

    return {
      all: stories + recipes + objects + properties,
      stories,
      recipes,
      objects,
      properties
    }
  }

  static async getContent(
    familyId: string,
    filter: ContentFilter = {},
    sort: ContentSort = 'recent',
    limit = 50,
    offset = 0
  ): Promise<Content[]> {
    const content: Content[] = []

    // Get stories if included in filter
    if (!filter.types || filter.types.includes('story')) {
      const stories = await this.getStories(familyId, filter, limit, offset)
      content.push(...stories)
    }

    // Get recipes if included in filter
    if (!filter.types || filter.types.includes('recipe')) {
      const recipes = await this.getRecipes(familyId, filter, limit, offset)
      content.push(...recipes)
    }

    // Get objects if included in filter
    if (!filter.types || filter.types.includes('object')) {
      const objects = await this.getObjects(familyId, filter, limit, offset)
      content.push(...objects)
    }

    // Get properties if included in filter
    if (!filter.types || filter.types.includes('property')) {
      const properties = await this.getProperties(familyId, filter, limit, offset)
      content.push(...properties)
    }

    // Sort the combined results
    return this.sortContent(content, sort)
  }

  private static async getStories(
    familyId: string, 
    filter: ContentFilter, 
    limit: number, 
    offset: number
  ): Promise<StoryContent[]> {
    let query = supabase
      .from('stories')
      .select(`
        *,
        profiles:profile_id (full_name),
        person_story_links (
          person_id,
          people (full_name)
        ),
        media (id)
      `)
      .eq('family_id', familyId)

    // Apply filters
    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`)
    }

    if (filter.tags?.length) {
      query = query.overlaps('tags', filter.tags)
    }

    const { data: stories } = await query.range(offset, offset + limit - 1)

    return (stories || []).map(story => ({
      id: story.id,
      type: 'story' as const,
      title: story.title,
      occurredAt: story.occurred_on,
      addedAt: story.created_at,
      location: null, // Stories don't have location in current schema
      peopleIds: story.person_story_links?.map((link: any) => link.person_id) || [],
      tags: story.tags || [],
      coverUrl: null, // Would need to get from media
      visibility: 'family', // Default for now
      status: 'published', // Default for now  
      authorId: story.profile_id,
      authorName: story.profiles?.full_name || 'Unknown',
      familyId: story.family_id,
      fields: {
        content: story.content,
        mediaCount: story.media?.length || 0
      }
    }))
  }

  private static async getRecipes(
    familyId: string,
    filter: ContentFilter,
    limit: number,
    offset: number
  ): Promise<RecipeContent[]> {
    let query = supabase
      .from('recipes')
      .select(`
        *,
        media (
          id,
          file_path,
          file_name
        )
      `)
      .eq('family_id', familyId)

    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,notes.ilike.%${filter.search}%`)
    }

    if (filter.tags?.length) {
      query = query.overlaps('dietary_tags', filter.tags)
    }

    const { data: recipes } = await query.range(offset, offset + limit - 1)

    // Map recipes and add cover URLs
    const recipesWithUrls = await Promise.all(
      (recipes || []).map(async recipe => ({
        id: recipe.id,
        type: 'recipe' as const,
        title: recipe.title,
        occurredAt: null,
        addedAt: recipe.created_at,
        location: null,
        peopleIds: [], // Recipe person links would need separate query
        tags: Array.isArray(recipe.dietary_tags) ? recipe.dietary_tags : [],
        coverUrl: sampleRecipeImageForTitle(recipe.title) || (
          recipe.media?.[0]?.file_path 
            ? await MediaService.getMediaUrl(recipe.media[0].file_path)
            : null
        ),
        visibility: 'family' as const,
        status: 'published' as const,
        authorId: recipe.created_by,
        authorName: 'Unknown',
        familyId: recipe.family_id,
        fields: {
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients as string[] : [],
          steps: Array.isArray(recipe.steps) ? recipe.steps as string[] : [],
          source: recipe.source,
          serves: recipe.serves,
          cookTime: recipe.time_cook_minutes,
          prepTime: recipe.time_prep_minutes
        }
      }))
    )

    return recipesWithUrls
  }

  private static async getObjects(
    familyId: string,
    filter: ContentFilter,
    limit: number,
    offset: number
  ): Promise<ObjectContent[]> {
    let query = supabase
      .from('things')
      .select(`*`)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (filter.search) {
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
    }

    if (filter.tags?.length) {
      query = query.overlaps('tags', filter.tags)
    }

    const { data: objects } = await query.range(offset, offset + limit - 1)

    return (objects || []).map(object => ({
      id: object.id,
      type: 'object' as const,
      title: object.title,
      occurredAt: object.year_estimated ? `${object.year_estimated}-01-01` : null,
      addedAt: object.created_at,
      location: null,
      peopleIds: [],
      tags: Array.isArray(object.tags) ? object.tags : [],
      coverUrl: null,
      visibility: 'family',
      status: 'published',
      authorId: object.created_by,
      authorName: 'Unknown',
      familyId: object.family_id,
      fields: {
        description: object.description,
        provenance: object.provenance,
        condition: object.condition,
        maker: object.maker,
        yearEstimated: object.year_estimated,
        valueEstimate: object.value_estimate
      }
    }))
  }

  private static async getProperties(
    familyId: string,
    filter: ContentFilter,
    limit: number,
    offset: number
  ): Promise<PropertyContent[]> {
    let query = supabase
      .from('properties')
      .select(`*`)
      .eq('family_id', familyId)

    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,address.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
    }

    const { data: properties } = await query.range(offset, offset + limit - 1)

    return (properties || []).map(property => ({
      id: property.id,
      type: 'property' as const,
      title: property.name,
      occurredAt: property.acquired_year ? `${property.acquired_year}-01-01` : null,
      addedAt: property.created_at,
      location: property.address,
      peopleIds: [],
      tags: [],
      coverUrl: null,
      visibility: 'family',
      status: 'published',
      authorId: property.created_by,
      authorName: 'Unknown',
      familyId: property.family_id,
      fields: {
        address: property.address,
        acquiredYear: property.acquired_year,
        soldYear: property.sold_year,
        description: property.description
      }
    }))
  }

  private static sortContent(content: Content[], sort: ContentSort): Content[] {
    return content.sort((a, b) => {
      switch (sort) {
        case 'recent':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        case 'oldest':
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'occurred-desc':
          if (!a.occurredAt && !b.occurredAt) return 0
          if (!a.occurredAt) return 1
          if (!b.occurredAt) return -1
          return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        case 'occurred-asc':
          if (!a.occurredAt && !b.occurredAt) return 0
          if (!a.occurredAt) return 1
          if (!b.occurredAt) return -1
          return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        default:
          return 0
      }
    })
  }
}