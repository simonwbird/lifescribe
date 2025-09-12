import { supabase } from '@/lib/supabase'
import { MediaService } from './mediaService'
import cookiesImg from '@/assets/grandma-cookies.jpg'
import potRoastImg from '@/assets/sunday-pot-roast.jpg'
import applePieImg from '@/assets/moms-apple-pie.jpg'
import ribsImg from '@/assets/bbq-ribs.jpg'
import familyDinnerImg from '@/assets/stories/family-dinner.jpg'
import familyVacationImg from '@/assets/stories/family-vacation.jpg'
import birthdayCelebrationImg from '@/assets/stories/birthday-celebration.jpg'
import weddingCeremonyImg from '@/assets/stories/wedding-ceremony.jpg'
import holidayGatheringImg from '@/assets/stories/holiday-gathering.jpg'
import graduationImg from '@/assets/stories/graduation.jpg'
import familyReunionImg from '@/assets/stories/family-reunion.jpg'
import newBabyImg from '@/assets/stories/new-baby.jpg'
import movingDayImg from '@/assets/stories/moving-day.jpg'
import anniversaryImg from '@/assets/stories/anniversary.jpg'
import schoolDayImg from '@/assets/stories/school-day.jpg'
import familyCookingImg from '@/assets/stories/family-cooking.jpg'
import sportsAchievementImg from '@/assets/stories/sports-achievement.jpg'
import beachVacationImg from '@/assets/stories/beach-vacation.jpg'
import campingTripImg from '@/assets/stories/camping-trip.jpg'
import firstCarImg from '@/assets/stories/first-car.jpg'
import newPetImg from '@/assets/stories/new-pet.jpg'
import waterfallAdventureImg from '@/assets/stories/waterfall-adventure.jpg'
import dadsWorkshopImg from '@/assets/stories/dads-workshop.jpg'
import type { 
  Content, 
  ContentFilter, 
  ContentSort, 
  ContentCounts,
  StoryContent,
  RecipeContent,
  ObjectContent,
  PropertyContent,
  PetContent
} from './collectionsTypes'

const sampleRecipeImageForTitle = (title: string): string | null => {
  const t = title.toLowerCase()
  if (t.includes('cookie')) return cookiesImg
  if (t.includes('pot roast')) return potRoastImg
  if (t.includes('apple pie')) return applePieImg
  if (t.includes('ribs')) return ribsImg
  return null
}

const sampleStoryImageForTitle = (title: string, content?: string): string | null => {
  const t = title.toLowerCase()
  const c = (content || '').toLowerCase()
  
  if (t.includes('dinner') || t.includes('meal') || c.includes('dinner') || c.includes('eating')) return familyDinnerImg
  if (t.includes('vacation') || t.includes('trip') || t.includes('travel') || c.includes('vacation')) return familyVacationImg
  if (t.includes('birthday') || c.includes('birthday') || c.includes('cake')) return birthdayCelebrationImg
  if (t.includes('wedding') || c.includes('wedding') || c.includes('married')) return weddingCeremonyImg
  if (t.includes('holiday') || t.includes('christmas') || t.includes('thanksgiving') || c.includes('holiday')) return holidayGatheringImg
  if (t.includes('graduation') || t.includes('graduate') || c.includes('graduation')) return graduationImg
  if (t.includes('reunion') || c.includes('reunion') || c.includes('extended family')) return familyReunionImg
  if (t.includes('baby') || t.includes('birth') || t.includes('born') || c.includes('newborn') || c.includes('hospital')) return newBabyImg
  if (t.includes('moving') || t.includes('new house') || t.includes('moved') || c.includes('moving') || c.includes('new home')) return movingDayImg
  if (t.includes('anniversary') || c.includes('anniversary') || c.includes('years together')) return anniversaryImg
  if (t.includes('school') || t.includes('first day') || c.includes('school') || c.includes('teacher')) return schoolDayImg
  if (t.includes('cooking') || t.includes('baking') || t.includes('recipe') || c.includes('kitchen') || c.includes('cooking')) return familyCookingImg
  if (t.includes('sports') || t.includes('game') || t.includes('trophy') || c.includes('baseball') || c.includes('soccer') || c.includes('victory')) return sportsAchievementImg
  if (t.includes('beach') || t.includes('ocean') || t.includes('sand') || c.includes('beach') || c.includes('swimming')) return beachVacationImg
  if (t.includes('camping') || t.includes('tent') || t.includes('campfire') || c.includes('camping') || c.includes('outdoors')) return campingTripImg
  if (t.includes('car') || t.includes('driving') || t.includes('license') || c.includes('first car') || c.includes('driving')) return firstCarImg
  if (t.includes('pet') || t.includes('dog') || t.includes('cat') || c.includes('puppy') || c.includes('kitten') || c.includes('adopted')) return newPetImg
  if (t.includes('waterfall') || t.includes('hiking') || t.includes('nature') || c.includes('waterfall') || c.includes('falls')) return waterfallAdventureImg
  if (t.includes('workshop') || t.includes('woodworking') || t.includes('tools') || c.includes('workshop') || c.includes('building') || c.includes('dad')) return dadsWorkshopImg
  
  return null
}

export class CollectionsService {
  static async getContentCounts(familyId: string): Promise<ContentCounts> {
    const [storiesResult, recipesResult, objectsResult, propertiesResult, petsResult] = await Promise.all([
      supabase.from('stories').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('recipes').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('things').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('properties').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('pets').select('id', { count: 'exact' }).eq('family_id', familyId)
    ])

    const stories = storiesResult.count || 0
    const recipes = recipesResult.count || 0
    const objects = objectsResult.count || 0
    const properties = propertiesResult.count || 0
    const pets = petsResult.count || 0

    return {
      all: stories + recipes + objects + properties + pets,
      stories,
      recipes,
      objects,
      properties,
      pets
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

    // Get pets if included in filter
    if (!filter.types || filter.types.includes('pet')) {
      const pets = await this.getPets(familyId, filter, limit, offset)
      content.push(...pets)
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
      coverUrl: sampleStoryImageForTitle(story.title, story.content),
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

  private static async getPets(
    familyId: string,
    filter: ContentFilter,
    limit: number,
    offset: number
  ): Promise<PetContent[]> {
    let query = supabase
      .from('pets')
      .select(`*`)
      .eq('family_id', familyId)

    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,breed.ilike.%${filter.search}%,species.ilike.%${filter.search}%`)
    }

    if (filter.tags?.length) {
      query = query.overlaps('tags', filter.tags)
    }

    const { data: pets } = await query.range(offset, offset + limit - 1)

    return (pets || []).map(pet => {
      // Calculate age from dob_approx if available
      let age = ''
      if (pet.dob_approx) {
        try {
          const dobDate = new Date(pet.dob_approx)
          const today = new Date()
          const years = today.getFullYear() - dobDate.getFullYear()
          age = years > 0 ? `${years} years` : 'Under 1 year'
        } catch {
          age = pet.dob_approx // Use the approx string as-is
        }
      }

      return {
        id: pet.id,
        type: 'pet' as const,
        title: pet.name,
        occurredAt: pet.gotcha_date || pet.dob_approx,
        addedAt: pet.created_at,
        location: pet.room,
        peopleIds: [], // Will add person links later
        tags: Array.isArray(pet.tags) ? pet.tags : [],
        coverUrl: pet.cover_url,
        visibility: 'family' as const,
        status: 'published' as const,
        authorId: pet.created_by,
        authorName: 'Unknown',
        familyId: pet.family_id,
        fields: {
          species: pet.species,
          breed: pet.breed,
          sex: pet.sex,
          age,
          status: pet.status as 'current' | 'past',
          microchipped: !!pet.microchip_number,
          vaccinesStatus: 'unknown' as const,
          insuranceStatus: pet.insurance_provider ? 'active' : 'none' as const,
          nextReminderDate: undefined,
          guardianNames: []
        }
      }
    })
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