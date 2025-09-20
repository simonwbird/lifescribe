import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JoinFamilyCard } from '@/components/onboarding/JoinFamilyCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { 
  BookHeart, 
  ArrowRight, 
  Heart, 
  Users, 
  TreePine,
  Clock,
  Star,
  ChevronRight,
  Home,
  Lock,
  Globe,
  Plus,
  MessageCircle,
  Camera,
  UserPlus
} from 'lucide-react'
// Import family photos and interface mockup
import heroFamilyStories from '@/assets/hero-family-stories.jpg'
import familyTechnology from '@/assets/family-technology.jpg'
import grandfatherGranddaughter from '@/assets/grandfather-granddaughter.jpg'
import familySelfie from '@/assets/family-selfie.jpg'
import lifescribeInterface from '@/assets/lifescribe-interface.jpg'

// HERO SECTION
const Hero = () => {
  return (
    <section className="relative bg-gradient-paper min-h-[60vh] flex items-center">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-hero lg:text-6xl font-serif font-bold leading-tight text-foreground">
                Some memories fade.{" "}
                <span className="text-accent-500">
                  Yours don't have to.
                </span>
              </h1>
            </div>
            <p className="text-xl font-sans text-muted-foreground leading-relaxed max-w-2xl">
              LifeScribe is the private family album where voices, photos, recipes, and adventures live forever — safely shared with the people you love most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-700 hover:bg-brand-600 text-white shadow-photo transition-all duration-300 hover:shadow-lg">
                <Link to="/login?redirect=onboarding">
                  <Plus className="mr-2 h-5 w-5" />
                  Start Your Family Album
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 text-brand-700 border-brand-700 hover:bg-brand-700 hover:text-white">
                <Link to="/login">Join Family Album</Link>
              </Button>
            </div>
            <p className="text-sm font-sans text-muted-foreground italic max-w-md mx-auto lg:mx-0">
              Each family has one album. If you've been invited, just join — no need to create another.
            </p>
            <div className="flex items-center gap-2 justify-center lg:justify-start text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Private by default. Invite-only. You always own your data.</span>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden shadow-photo bg-card border border-border">
              <img 
                src={heroFamilyStories} 
                alt="Multi-generational family sharing stories and memories together around a table"
                className="w-full h-full object-cover aspect-[4/3]"
              />
            </div>
            {/* Decorative photo corner */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-card border border-border rounded-lg shadow-frame transform rotate-6 opacity-80"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

// WHY FAMILIES LOVE LIFESCRIBE SECTION (moved before features)
const WhyFamiliesLoveSection = () => (
  <section className="py-20 bg-gradient-paper">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h1 font-serif font-semibold mb-6 text-foreground">
            Why families love LifeScribe
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <p className="text-xl font-serif font-medium text-foreground leading-relaxed">Bridge generations with stories kids will ask for again and again.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                <BookHeart className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <p className="text-xl font-serif font-medium text-foreground leading-relaxed">Bring dusty photo boxes back to life where everyone can see them.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <p className="text-xl font-serif font-medium text-foreground leading-relaxed">Keep faraway family connected in one shared space.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                <Home className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <p className="text-xl font-serif font-medium text-foreground leading-relaxed">Feel safe knowing your memories stay private, warm, and only for you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// HOW LIFESCRIBE WORKS SECTION (simplified features)
const HowLifeScribeWorksSection = () => (
  <section className="py-20 bg-neutral-section relative">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-6">
          <h2 className="text-h1 font-serif font-semibold text-foreground">
            How LifeScribe works for your family
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <TreePine className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">A family tree that grows with you</h3>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <Clock className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Timelines you can wander</h3>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <BookHeart className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Recipes & heirlooms with their stories</h3>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <Heart className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Voices you can replay</h3>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden shadow-photo aspect-[4/3] border border-border">
              <img 
                src={lifescribeInterface} 
                alt="Clean LifeScribe interface showing family timeline with photos, stories, and voice notes"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Polaroid-style decoration */}
            <div className="absolute -top-3 -left-3 w-20 h-24 bg-card border border-border rounded-sm shadow-frame transform -rotate-12"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// MID-PAGE EMOTIONAL HOOK
const EmotionalHookSection = () => (
  <section className="py-20 bg-neutral-section relative overflow-hidden">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-hero font-serif font-bold leading-tight text-foreground">
          Imagine your granddaughter discovering the recipe you cooked every Sunday, 
          <span className="text-accent-500 italic"> in your handwriting.</span> 
          Or hearing your laugh for the very first time.
        </h2>
        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-700 hover:bg-brand-600 text-white shadow-photo transition-all duration-300 hover:shadow-lg">
          <Link to="/login?redirect=onboarding">
            Preserve a Memory Today <Heart className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
    {/* Subtle background decoration */}
    <div className="absolute top-10 right-10 w-32 h-40 bg-card border border-border rounded-lg shadow-frame transform rotate-12 opacity-30"></div>
    <div className="absolute bottom-10 left-10 w-24 h-32 bg-card border border-border rounded-lg shadow-frame transform -rotate-6 opacity-30"></div>
  </section>
)

// TESTIMONIALS
const TestimonialCard = ({ quote, author }: { quote: string, author: string }) => (
  <Card className="bg-card rounded-lg shadow-photo border border-border p-6 h-full relative">
    <CardContent className="p-0">
      <div className="mb-6">
        <div className="text-4xl text-accent-500 font-serif leading-none">"</div>
      </div>
      <p className="text-lg font-sans mb-6 italic leading-relaxed text-foreground">
        {quote}
      </p>
      <p className="font-sans font-medium text-muted-foreground">— {author}</p>
    </CardContent>
    {/* Decorative corner */}
    <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-700 rounded-full opacity-60"></div>
  </Card>
)

const TestimonialsSection = () => (
  <section className="py-20 bg-gradient-paper">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <TestimonialCard
            quote="I never thought my mum would love technology — but she records little stories for the grandkids every week. They can't wait to listen."
            author="Sarah A."
          />
          <TestimonialCard
            quote="Our family tree used to be just names. Now it's voices, recipes, and photos. It feels alive."
            author="Daniel B."
          />
          <TestimonialCard
            quote="It's like a private scrapbook that everyone can add to. But safer, and it will never get lost."
            author="Priya M."
          />
        </div>
        
        <div className="text-center space-y-6">
          <p className="text-lg font-sans text-muted-foreground">
            Join families already building their living archives with LifeScribe.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-700 hover:bg-brand-600 text-white shadow-photo transition-all duration-300 hover:shadow-lg">
            <Link to="/login?redirect=onboarding">
              Start Your Family Album
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
)

// SIMPLE HOW IT WORKS SECTION
const SimpleHowItWorksSection = () => (
  <section className="py-20 bg-neutral-canvas" id="how-it-works">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h1 font-serif font-semibold mb-6 text-foreground">
            Simple, like telling a story around the table.
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-700 rounded-lg flex items-center justify-center shadow-frame">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Answer a gentle prompt</h3>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-700 rounded-lg flex items-center justify-center shadow-frame">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Snap a photo or record a memory</h3>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-700 rounded-lg flex items-center justify-center shadow-frame">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Invite family to join in</h3>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// ELDER INSPIRATION NOTE
const ElderInspirationSection = () => (
  <section className="py-16 bg-neutral-canvas">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-lg font-sans text-muted-foreground leading-relaxed italic">
          Not sure where to start? LifeScribe gives you gentle prompts to spark memories — so even the smallest story can come to life.
        </p>
      </div>
    </div>
  </section>
)

// FOOTER
const Footer = () => (
  <footer className="py-16 bg-neutral-section border-t border-border">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookHeart className="h-8 w-8 text-brand-700" />
              <h3 className="text-xl font-serif font-bold text-foreground">LifeScribe</h3>
            </div>
            <p className="text-sm font-sans text-muted-foreground leading-relaxed">
              Where your family stories live forever.
            </p>
          </div>
          
          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-serif font-semibold text-foreground">Product</h4>
            <ul className="space-y-2">
              <li><Link to="#how-it-works" className="text-sm font-sans text-muted-foreground hover:text-foreground">How it Works</Link></li>
              <li><Link to="/login" className="text-sm font-sans text-muted-foreground hover:text-foreground">Sign In</Link></li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-serif font-semibold text-foreground">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">About</a></li>
              <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">Terms</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-serif font-semibold text-foreground">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">Help Center</a></li>
              <li><a href="#" className="text-sm font-sans text-muted-foreground hover:text-foreground">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm font-sans text-muted-foreground">
            © 2024 LifeScribe. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
)

// LOGIN FORM COMPONENT
const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      if (isSignUp) {
        setError('Check your email for a verification link!')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-serif text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUp ? 'Start your family album' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailAuth} className="space-y-4">
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
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <Button onClick={handleGoogleAuth} variant="outline" className="w-full">
          Continue with Google
        </Button>
        
        <div className="text-center text-sm">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// HEADER COMPONENT
const LandingHeader = () => (
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4">
      <div className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BookHeart className="h-8 w-8 text-brand-700" />
          <span className="text-xl font-serif font-bold text-foreground">LifeScribe</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-sans">Login</Button>
            </DialogTrigger>
            <DialogContent className="p-0 border-0 bg-transparent shadow-none">
              <LoginForm />
            </DialogContent>
          </Dialog>
          <Button asChild className="rounded-md bg-brand-primary hover:bg-brand-primary/90 text-brand-primary-foreground px-6 font-sans">
            <Link to="/login?redirect=onboarding">Start Your Family Album</Link>
          </Button>
        </div>
      </div>
    </div>
  </header>
)

// MAIN LANDING COMPONENT
export default function Landing() {
  return (
    <div className="min-h-screen bg-neutral-canvas">
      <LandingHeader />
      <Hero />
      <WhyFamiliesLoveSection />
      <HowLifeScribeWorksSection />
      <EmotionalHookSection />
      <TestimonialsSection />
      <SimpleHowItWorksSection />
      <ElderInspirationSection />
      <Footer />
    </div>
  )
}