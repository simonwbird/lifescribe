import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { 
  BookHeart, 
  Lock, 
  ArrowRight, 
  Heart, 
  Users, 
  Camera,
  MessageCircle,
  Shield
} from 'lucide-react'

const Hero = () => (
  <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20 lg:py-32">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Preserve Your Family Stories Forever
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          LifeScribe is your private family memory platform. Capture stories, answer prompts, 
          and create a lasting archive that connects generations.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6">
          <Link to="/onboarding">
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
)

const FeatureSection = ({ 
  title, 
  description, 
  icon: Icon, 
  imageSrc, 
  reverse = false,
  children 
}: {
  title: string
  description: string
  icon: React.ComponentType<any>
  imageSrc?: string
  reverse?: boolean
  children?: React.ReactNode
}) => (
  <section className="py-16 lg:py-24">
    <div className="container mx-auto px-4">
      <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
        <div className={reverse ? 'lg:order-2' : 'lg:order-1'}>
          <div className="flex items-center mb-6">
            <div className="p-3 bg-primary/10 rounded-full mr-4">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
          </div>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {description}
          </p>
          {children}
        </div>
        <div className={reverse ? 'lg:order-1' : 'lg:order-2'}>
          {imageSrc ? (
            <div className="relative">
              <img 
                src="/placeholder.svg" 
                alt={title}
                className="rounded-2xl shadow-2xl w-full h-64 md:h-80 object-cover bg-muted"
              />
            </div>
          ) : children}
        </div>
      </div>
    </div>
  </section>
)

const ExamplePromptCard = () => (
  <Card className="max-w-md mx-auto bg-card/50 backdrop-blur border-primary/20">
    <CardContent className="p-6">
      <div className="flex items-start space-x-3 mb-4">
        <MessageCircle className="h-5 w-5 text-primary mt-1" />
        <div>
          <h3 className="font-semibold text-sm text-primary mb-1">Daily Prompt</h3>
          <p className="text-sm text-muted-foreground">Family • Childhood</p>
        </div>
      </div>
      <h4 className="font-medium mb-3">
        "What is your earliest memory, and what made it so special?"
      </h4>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 border-2 border-background"></div>
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/60 border-2 border-background"></div>
          </div>
          <span className="text-xs text-muted-foreground">3 family members</span>
        </div>
        <Button size="sm" variant="ghost" className="text-xs">
          Answer <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
)

const CallToAction = () => (
  <section className="py-20 lg:py-32 bg-gradient-to-r from-primary/5 to-secondary/5">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-5xl font-bold mb-6">
        Start Your Family Archive Today
      </h2>
      <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Join thousands of families preserving their stories for future generations. 
        Create your private family space in minutes.
      </p>
      <Button asChild size="lg" className="text-lg px-8 py-6">
        <Link to="/onboarding">
          Create Your Family Archive <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    </div>
  </section>
)

const Footer = () => (
  <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <BookHeart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">LifeScribe</span>
          </div>
          <p className="text-muted-foreground">
            Preserving family stories, one memory at a time.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Features</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>Private Family Spaces</li>
            <li>Story Capture & Sharing</li>
            <li>Guided Memory Prompts</li>
            <li>Secure Media Storage</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Get Started</h3>
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="justify-start p-0">
              <Link to="/onboarding">Create Family Account</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
        <p>&copy; 2024 LifeScribe. Made with ❤️ for families everywhere.</p>
      </div>
    </div>
  </footer>
)

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        })
        if (error) throw error
        setError('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/feed')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">LifeScribe</CardTitle>
        <CardDescription>
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const LandingHeader = () => (
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4">
      <div className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BookHeart className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">LifeScribe</span>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Login</Button>
          </DialogTrigger>
          <DialogContent className="p-0 border-0 bg-transparent shadow-none">
            <LoginForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </header>
)

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <Hero />
      
      <FeatureSection
        title="Capture Your Family Stories"
        description="Share photos, videos, and written memories in your private family space. Every story becomes part of your family's permanent archive, accessible to all family members across generations."
        icon={Camera}
        imageSrc="/placeholder.svg"
      />
      
      <FeatureSection
        title="Answer Prompts, Keep Memories Alive"
        description="Discover new stories with our carefully crafted memory prompts. From childhood adventures to family traditions, these guided questions help unlock precious memories you might have forgotten."
        icon={Heart}
        reverse
      >
        <div className="space-y-6">
          <ExamplePromptCard />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              New prompts delivered weekly to keep the conversation flowing
            </p>
          </div>
        </div>
      </FeatureSection>
      
      <FeatureSection
        title="Private & Secure"
        description="Your family memories are precious and private. LifeScribe uses bank-level security to ensure only your family members can access your stories. No ads, no data mining – just your memories, safely preserved."
        icon={Shield}
      >
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
            <Lock className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium text-sm">End-to-End Encryption</h4>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-lg">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-medium text-sm">Family-Only Access</h4>
          </div>
        </div>
      </FeatureSection>
      
      <CallToAction />
      <Footer />
    </div>
  )
}