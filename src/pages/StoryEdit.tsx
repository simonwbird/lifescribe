import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Header from '@/components/Header'
import StoryWizard from '@/components/story-wizard/StoryWizard'

export default function StoryEdit() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StoryWizard />
    </div>
  )
}