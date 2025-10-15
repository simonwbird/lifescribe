import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Pet } from '@/lib/petTypes'

// Convert database row to Pet type (same logic as usePets)
function mapPetRow(row: any): Pet {
  return {
    id: row.id,
    familyId: row.family_id,
    createdBy: row.created_by,
    name: row.name,
    species: row.species,
    breed: row.breed || undefined,
    sex: (row.sex as 'male' | 'female' | 'unknown') || undefined,
    neutered: row.neutered || undefined,
    color: row.color || undefined,
    markings: row.markings || undefined,
    dobApprox: row.dob_approx || undefined,
    gotchaDate: row.gotcha_date || undefined,
    passedAt: row.passed_at || undefined,
    microchip: {
      number: row.microchip_number || undefined,
      provider: row.microchip_provider || undefined,
      date: row.microchip_date || undefined,
    },
    license: {
      number: row.license_number || undefined,
      expires: row.license_expires || undefined,
      authority: row.license_authority || undefined,
    },
    registry: {
      org: row.registry_org || undefined,
      id: row.registry_id || undefined,
    },
    dnaTest: {
      provider: row.dna_test_provider || undefined,
      url: row.dna_test_url || undefined,
    },
    vet: row.vet_name ? {
      name: row.vet_name,
      phone: row.vet_phone || undefined,
      email: row.vet_email || undefined,
    } : undefined,
    insurance: {
      provider: row.insurance_provider || undefined,
      policy: row.insurance_policy || undefined,
      renews: row.insurance_renews || undefined,
    },
    health: {
      weightKg: row.weight_kg || undefined,
      diet: row.diet || undefined,
      allergies: row.allergies || undefined,
      medications: row.medications || undefined,
      conditions: row.conditions || undefined,
      vaccines: row.vaccines || undefined,
      visits: row.visits || undefined,
    },
    roles: row.roles || undefined,
    awards: row.awards || undefined,
    temperament: row.temperament || undefined,
    favorites: row.favorites || undefined,
    routine: {
      feeding: row.feeding_routine || undefined,
      walks: row.walk_routine || undefined,
      bedtime: row.bedtime_routine || undefined,
    },
    careInstructions: row.care_instructions || undefined,
    guardianIds: row.guardian_ids || [],
    propertyId: row.property_id || undefined,
    room: row.room || undefined,
    breederRescue: row.breeder_rescue || undefined,
    coverUrl: row.cover_url || undefined,
    status: row.status,
    tags: row.tags || [],
    reminders: row.reminders || undefined,
    memoryMessage: row.memory_message || undefined,
    statusChangedAt: row.status_changed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function usePet(petId: string | null, familyId: string | null) {
  return useQuery({
    queryKey: ['pet', petId, familyId],
    queryFn: async (): Promise<Pet | null> => {
      if (!petId || !familyId) return null

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('family_id', familyId)
        .single()

      if (error) throw error
      return data ? mapPetRow(data) : null
    },
    enabled: !!petId && !!familyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
