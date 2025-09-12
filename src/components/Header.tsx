import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link, useNavigate } from 'react-router-dom'
import type { Profile } from '@/lib/types'

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/home" className="text-xl font-serif text-charcoal hover:text-sage transition-colors">
            LifeScribe
          </Link>
            <nav className="flex space-x-4">
            <Link to="/home" className="text-body font-medium text-charcoal hover:text-sage transition-colors">
              Home
            </Link>
            <Link to="/stories/new" className="text-body font-medium text-charcoal hover:text-sage transition-colors">
              Create +
            </Link>
            <Link to="/family/members" className="text-body font-medium text-charcoal hover:text-sage transition-colors">
              People
            </Link>
            <Link to="/family/tree" className="text-body font-medium text-charcoal hover:text-sage transition-colors">
              Tree
            </Link>
            <Link to="/archive" className="text-body font-medium text-charcoal hover:text-sage transition-colors">
              Library
            </Link>
            <Link to="/prompts" className="text-body font-medium text-charcoal hover:text-sage transition-colors">
              Prompts
            </Link>
            <Link to="/feed" className="text-body font-medium text-charcoal hover:text-sage transition-colors">
              Feed
            </Link>
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback>
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}