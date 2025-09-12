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
  ArrowRight, 
  Heart, 
  Users, 
  TreePine,
  Clock,
  Star,
  ChevronRight,
  Home,
  Lock,
  Globe
} from 'lucide-react'

// Import family photos
import heroFamilyStories from '@/assets/hero-family-stories.jpg'
import familyTechnology from '@/assets/family-technology.jpg'
import grandfatherGranddaughter from '@/assets/grandfather-granddaughter.jpg'
import familySelfie from '@/assets/family-selfie.jpg'

// HERO SECTION
const Hero = () => (
  <section className="relative bg-gradient-paper min-h-[60vh] flex items-center">
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <p className="text-lg font-sans text-muted-foreground italic">
              Where your family stories live forever.
            </p>
            <h1 className="text-hero lg:text-6xl font-serif font-bold leading-tight text-foreground">
              Some stories live in photo albums.{" "}
              <span className="text-brand-primary">
                Others only live in our hearts.
              </span>
            </h1>
          </div>
          <p className="text-xl font-sans text-muted-foreground leading-relaxed max-w-2xl">
            LifeScribe is a private home for the memories that matter most — the voices, photos, recipes, and adventures you never want to lose.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-primary hover:bg-brand-primary/90 text-brand-primary-foreground shadow-photo transition-all duration-300 hover:shadow-lg">
            <Link to="/onboarding">
              Begin Your Family Story <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden shadow-photo bg-card border border-border">
            <img 
              src={heroFamilyStories} 
              alt="Multi-generational family sharing stories and memories together around a table"
              className="w-full h-full object-cover aspect-[4/3]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scrapbook-shadow/20 to-transparent"></div>
          </div>
          {/* Decorative photo corner */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-card border border-border rounded-lg shadow-frame transform rotate-6 opacity-80"></div>
        </div>
      </div>
    </div>
  </section>
)

// EXPERIENCE SECTION
const ExperienceSection = () => (
  <section className="py-20 bg-muted/30 relative">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-6">
          <h2 className="text-h1 font-serif font-semibold text-foreground">
            Your family, woven into one story
          </h2>
          <p className="text-body font-sans text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Every memory has a place. Every voice can be heard. LifeScribe gathers it all in one living family archive.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-brand-accent rounded-lg">
                <TreePine className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">A tree that grows with your family</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Navigate through generations with stories and photos that bring names to life.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-brand-accent rounded-lg">
                <Clock className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">A timeline you can wander through</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Watch your family's history unfold through beautifully organized moments.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-brand-accent rounded-lg">
                <BookHeart className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Recipes and heirlooms paired with their stories</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Preserve not just the objects, but the love and memories behind them.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-brand-accent rounded-lg">
                <Heart className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Voices and laughter you can replay whenever you miss them</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Capture the sounds that make memories truly come alive.</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden shadow-photo aspect-[4/3] border border-border">
              <img 
                src={familyTechnology} 
                alt="Family using LifeScribe to explore their memories together on a tablet"
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

// BENEFITS SECTION
const BenefitsSection = () => (
  <section className="py-20 bg-gradient-paper">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h1 font-serif font-semibold mb-6 text-foreground">
            Why families fall in love with LifeScribe
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-brand-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-foreground">Grandparents sharing stories the kids will listen to again and again</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Bridge generations with stories that captivate and connect.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <BookHeart className="h-6 w-6 text-brand-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-foreground">Old photos no longer tucked away in dusty boxes</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Bring forgotten memories back to life where everyone can see them.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-brand-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-foreground">Family scattered across the world, connected in one place</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Distance can't separate hearts when memories bring you together.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <Home className="h-6 w-6 text-brand-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-foreground">A safe space that feels like home — private, warm, and only for you</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Your memories are protected in a space designed just for family.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// EMOTIONAL MOMENT SECTION
const EmotionalSection = () => (
  <section className="py-20 bg-muted/20 relative overflow-hidden">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-hero font-serif font-bold leading-tight text-foreground">
          Imagine your granddaughter discovering the recipe you cooked every Sunday, 
          <span className="text-brand-primary italic"> in your handwriting.</span> 
          Or hearing your laugh for the very first time.
        </h2>
        <p className="text-body font-sans text-muted-foreground leading-relaxed max-w-4xl mx-auto">
          LifeScribe makes sure the details — the ones that make life beautiful — are never forgotten.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-primary hover:bg-brand-primary/90 text-brand-primary-foreground shadow-photo transition-all duration-300 hover:shadow-lg">
          <Link to="/onboarding">
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
        <div className="text-4xl text-brand-primary font-serif leading-none">"</div>
      </div>
      <p className="text-lg font-sans mb-6 italic leading-relaxed text-foreground">
        {quote}
      </p>
      <p className="font-sans font-medium text-muted-foreground">— {author}</p>
    </CardContent>
    {/* Decorative corner */}
    <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-accent rounded-full opacity-60"></div>
  </Card>
)

const TestimonialsSection = () => (
  <section className="py-20 bg-gradient-paper">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h1 font-serif font-semibold mb-6 text-foreground">
            Families are already writing their next chapters
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="I never thought my mum would love technology — but she records little stories for the grandkids every week. They can't wait to listen."
            author="Sarah J."
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
      </div>
    </div>
  </section>
)

// HOW IT WORKS
const HowItWorksSection = () => (
  <section className="py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h1 font-serif font-semibold mb-6 text-foreground">
            Simple, like telling a story around the table.
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-primary rounded-lg flex items-center justify-center text-brand-primary-foreground text-2xl font-serif font-bold shadow-frame">
              1
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Answer a gentle prompt</h3>
            <p className="text-lg font-sans text-muted-foreground leading-relaxed">Like "What was your first job?" or something that sparks a memory.</p>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-primary rounded-lg flex items-center justify-center text-brand-primary-foreground text-2xl font-serif font-bold shadow-frame">
              2
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Add a photo, recipe, or short voice note</h3>
            <p className="text-lg font-sans text-muted-foreground leading-relaxed">Share the pictures, sounds, and details that make the story complete.</p>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-primary rounded-lg flex items-center justify-center text-brand-primary-foreground text-2xl font-serif font-bold shadow-frame">
              3
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Invite family to listen, share, and add their own</h3>
            <p className="text-lg font-sans text-muted-foreground leading-relaxed">Watch as your family archive grows with everyone's contributions.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// FINAL CTA
const FinalCallToAction = () => (
  <section className="py-20 bg-gradient-paper relative">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-hero font-serif font-bold leading-tight text-foreground">
          Your story is a gift.{" "}
          <span className="text-brand-primary">Pass it on.</span>
        </h2>
        <p className="text-body font-sans text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          Join the families building their own living archives with LifeScribe.
        </p>
        <Button asChild size="lg" className="text-xl px-12 py-8 rounded-md font-sans font-medium bg-brand-primary hover:bg-brand-primary/90 text-brand-primary-foreground shadow-photo transition-all duration-300 hover:shadow-lg">
          <Link to="/onboarding">
            Begin Today with LifeScribe <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
    {/* Decorative elements */}
    <div className="absolute top-16 left-16 w-16 h-20 bg-card border border-border rounded-sm shadow-frame transform rotate-12 opacity-40"></div>
    <div className="absolute bottom-16 right-16 w-20 h-16 bg-card border border-border rounded-sm shadow-frame transform -rotate-6 opacity-40"></div>
  </section>
)

const Footer = () => (
  <footer className="border-t bg-card/50 backdrop-blur">
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center space-x-3">
            <BookHeart className="h-8 w-8 text-brand-primary" />
            <span className="text-2xl font-serif font-bold text-foreground">LifeScribe</span>
          </div>
          <p className="text-sm font-sans text-muted-foreground italic mb-2">
            Where your family stories live forever.
          </p>
          <p className="text-muted-foreground font-sans leading-relaxed max-w-md">
            Preserving family stories, one memory at a time. Connect generations through 
            shared memories in your private family archive.
          </p>
        </div>
        <div>
          <h3 className="font-serif font-semibold mb-4 text-foreground">Company</h3>
          <ul className="space-y-3 text-muted-foreground font-sans">
            <li><Link to="#" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link to="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
            <li><Link to="#" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-serif font-semibold mb-4 text-foreground">Get Started</h3>
          <Button asChild variant="ghost" className="justify-start p-0 text-muted-foreground hover:text-foreground font-sans">
            <Link to="/onboarding">Create Family Account</Link>
          </Button>
        </div>
      </div>
      <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
        <p className="font-sans">&copy; 2025 LifeScribe. Made with ❤️ for families everywhere.</p>
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
    <Card className="w-full max-w-md shadow-photo border border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif">LifeScribe</CardTitle>
        <CardDescription className="font-sans">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-sans">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-sans">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md"
            />
          </div>
          {error && (
            <Alert variant="destructive" className="rounded-md">
              <AlertDescription className="font-sans">{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full rounded-md font-sans" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-sans"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const LandingHeader = () => (
  <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95 shadow-sm">
    <div className="container mx-auto px-4">
      <div className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <BookHeart className="h-8 w-8 text-brand-primary" />
          <span className="text-2xl font-serif font-bold text-foreground">LifeScribe</span>
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
            <Link to="/onboarding">Start</Link>
          </Button>
        </div>
      </div>
    </div>
  </header>
)

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <ExperienceSection />
      <BenefitsSection />
      <EmotionalSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <FinalCallToAction />
      <Footer />
    </div>
  )
}