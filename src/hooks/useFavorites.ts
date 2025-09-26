import { useState, useEffect } from 'react'
import { 
  Favorite, 
  CreateFavoriteRequest, 
  UpdateFavoriteRequest,
  createFavorite, 
  updateFavorite, 
  getFavorites, 
  deleteFavorite 
} from '@/services/favoritesService'

export function useFavorites(personId?: string) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = async () => {
    if (!personId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getFavorites(personId)
      setFavorites(data)
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites')
    } finally {
      setLoading(false)
    }
  }

  const addFavorite = async (favoriteData: CreateFavoriteRequest): Promise<Favorite> => {
    try {
      setError(null)
      const newFavorite = await createFavorite(favoriteData)
      setFavorites(prev => [newFavorite, ...prev])
      return newFavorite
    } catch (err) {
      console.error('Error adding favorite:', err)
      setError(err instanceof Error ? err.message : 'Failed to add favorite')
      throw err
    }
  }

  const editFavorite = async (favoriteId: string, updates: UpdateFavoriteRequest): Promise<Favorite> => {
    try {
      setError(null)
      const updatedFavorite = await updateFavorite(favoriteId, updates)
      setFavorites(prev => prev.map(f => f.id === favoriteId ? updatedFavorite : f))
      return updatedFavorite
    } catch (err) {
      console.error('Error updating favorite:', err)
      setError(err instanceof Error ? err.message : 'Failed to update favorite')
      throw err
    }
  }

  const removeFavorite = async (favoriteId: string): Promise<void> => {
    try {
      setError(null)
      await deleteFavorite(favoriteId)
      setFavorites(prev => prev.filter(f => f.id !== favoriteId))
    } catch (err) {
      console.error('Error deleting favorite:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete favorite')
      throw err
    }
  }

  const getFavoritesByType = (type: Favorite['type']) => {
    return favorites.filter(f => f.type === type)
  }

  useEffect(() => {
    fetchFavorites()
  }, [personId])

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    editFavorite,
    removeFavorite,
    getFavoritesByType
  }
}