import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import RecipeWizard from '@/components/recipe/RecipeWizard'

export default function RecipeEdit() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <RecipeWizard />
      </div>
    </AuthGate>
  )
}