import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Header from '@/components/Header'
import RecipeWizard from '@/components/recipe/RecipeWizard'

export default function RecipeEdit() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <RecipeWizard />
    </div>
  )
}