import { supabase } from '@/lib/supabase'
import type { Property, PropertyWithDetails } from './propertyTypes'

export class PropertyService {
  /**
   * Get all properties for a family with optional filtering
   */
  static async getProperties(
    familyId: string,
    filters?: {
      search?: string
      types?: string[]
      status?: string[]
      city?: string
      country?: string
    }
  ): Promise<PropertyWithDetails[]> {
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_occupancy (
          id,
          property_id,
          person_id,
          role,
          start_date,
          start_date_circa,
          end_date,
          end_date_circa,
          primary_home,
          notes,
          family_id,
          created_at,
          people (
            id,
            full_name,
            avatar_url
          )
        ),
        property_visits (
          id,
          property_id,
          people_ids,
          start_date,
          end_date,
          recurring_pattern,
          occasion,
          notes,
          family_id,
          created_by,
          created_at
        ),
        property_events (
          id,
          property_id,
          event_type,
          event_date,
          event_date_circa,
          title,
          notes,
          media_ids,
          story_id,
          people_ids,
          family_id,
          created_by,
          created_at
        ),
        property_rooms (
          id,
          property_id,
          name,
          notes,
          family_id,
          created_by,
          created_at
        )
      `)
      .eq('family_id', familyId)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (filters?.search) {
      query = query.or(`display_title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status as any)
    }

    if (filters?.types && filters.types.length > 0) {
      query = query.overlaps('property_types', filters.types as any)
    }

    const { data: properties, error } = await query

    if (error) {
      console.error('Error fetching properties:', error)
      return []
    }

    return (properties || []).map(property => ({
      ...property,
      address_json: property.address_json as any,
      geocode: property.geocode as any,
      occupancy: property.property_occupancy || [],
      visits: property.property_visits || [],
      events: property.property_events || [],
      rooms: property.property_rooms || [],
      media_count: 0, // TODO: Add media count
      story_count: 0, // TODO: Add story count  
      object_count: 0 // TODO: Add object count
    }))
  }

  /**
   * Get a single property with all details
   */
  static async getProperty(propertyId: string): Promise<PropertyWithDetails | null> {
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_occupancy (
          id,
          person_id,
          role,
          start_date,
          end_date,
          primary_home,
          notes,
          people (
            id,
            full_name,
            avatar_url
          )
        ),
        property_visits (
          id,
          people_ids,
          start_date,
          end_date,
          recurring_pattern,
          occasion,
          notes
        ),
        property_events (
          id,
          event_type,
          event_date,
          event_date_circa,
          title,
          notes,
          media_ids,
          story_id,
          people_ids
        ),
        property_rooms (
          id,
          name,
          notes
        )
      `)
      .eq('id', propertyId)
      .single()

    if (error) {
      console.error('Error fetching property:', error)
      return null
    }

    return {
      ...property,
      occupancy: property.property_occupancy || [],
      visits: property.property_visits || [],
      events: property.property_events || [],
      rooms: property.property_rooms || [],
      media_count: 0, // TODO: Add media count
      story_count: 0, // TODO: Add story count
      object_count: 0 // TODO: Add object count
    }
  }

  /**
   * Create a new property
   */
  static async createProperty(propertyData: Partial<Property>): Promise<Property | null> {
    const user = await supabase.auth.getUser()
    const { data: property, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        address_json: propertyData.address_json as any,
        geocode: propertyData.geocode as any,
        created_by: user.data.user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating property:', error)
      return null
    }

    return { ...property, address_json: property.address_json as any, geocode: property.geocode as any }
  }

  /**
   * Update a property
   */
  static async updateProperty(propertyId: string, updates: Partial<Property>): Promise<Property | null> {
    const { data: property, error } = await supabase
      .from('properties')
      .update({
        ...updates,
        address_json: updates.address_json as any,
        geocode: updates.geocode as any,
      })
      .eq('id', propertyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating property:', error)
      return null
    }

    return { ...property, address_json: property.address_json as any, geocode: property.geocode as any }
  }

  /**
   * Delete a property
   */
  static async deleteProperty(propertyId: string): Promise<boolean> {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)

    if (error) {
      console.error('Error deleting property:', error)
      return false
    }

    return true
  }

  /**
   * Get property counts by status for a family
   */
  static async getPropertyCounts(familyId: string): Promise<{
    total: number
    current: number
    sold: number
    rented: number
    demolished: number
    unknown: number
  }> {
    const { data: counts, error } = await supabase
      .from('properties')
      .select('status')
      .eq('family_id', familyId)

    if (error) {
      console.error('Error fetching property counts:', error)
      return { total: 0, current: 0, sold: 0, rented: 0, demolished: 0, unknown: 0 }
    }

    const result = {
      total: counts?.length || 0,
      current: 0,
      sold: 0,
      rented: 0,
      demolished: 0,
      unknown: 0
    }

    counts?.forEach(property => {
      if (property.status in result) {
        result[property.status as keyof typeof result]++
      }
    })

    return result
  }

  /**
   * Format address for display based on privacy settings
   */
  static formatAddress(property: Property): string {
    const address = property.address_json
    if (!address) return ''

    switch (property.address_visibility) {
      case 'exact':
        return [address.line1, address.line2, address.city, address.region, address.postcode, address.country]
          .filter(Boolean)
          .join(', ')
      case 'street_hidden':
        return [address.city, address.region, address.country]
          .filter(Boolean)
          .join(', ')
      case 'city_only':
        return [address.city, address.country]
          .filter(Boolean)
          .join(', ')
      default:
        return ''
    }
  }

  /**
   * Get properties for a specific person
   */
  static async getPropertiesForPerson(personId: string): Promise<PropertyWithDetails[]> {
    const { data: occupancies, error } = await supabase
      .from('property_occupancy')
      .select(`
        *,
        properties (
          *
        )
      `)
      .eq('person_id', personId)

    if (error) {
      console.error('Error fetching person properties:', error)
      return []
    }

    return (occupancies || []).map(occupancy => ({
      ...occupancy.properties,
      address_json: occupancy.properties.address_json as any,
      geocode: occupancy.properties.geocode as any,
      occupancy: [occupancy]
    }))
  }
}