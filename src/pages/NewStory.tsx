import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import StoryWizard from '@/components/story-wizard/StoryWizard'

export default function NewStory() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <StoryWizard />
      </div>
    </AuthGate>
  )
}