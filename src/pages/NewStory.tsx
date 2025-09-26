import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Header from '@/components/Header'
import StoryWizard from '@/components/story-wizard/StoryWizard'

export default function NewStory() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryWizard />
    </div>
  )
}