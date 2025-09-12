import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CategoryChooser from '@/components/objects/CategoryChooser'
import ArtifactWizard from '@/components/objects/ArtifactWizard'

export default function ObjectsNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category')
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl)

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    // Update URL to reflect selected category
    navigate(`/objects/new?category=${categoryId}`, { replace: true })
  }

  const handleCancel = () => {
    navigate('/collections?tab=object')
  }

  const handleComplete = () => {
    navigate('/collections?tab=object')
  }

  if (selectedCategory) {
    return (
      <ArtifactWizard
        categoryId={selectedCategory}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <CategoryChooser
      onCategorySelect={handleCategorySelect}
      onCancel={handleCancel}
    />
  )
}