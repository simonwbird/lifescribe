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
  Shield,
  Quote,
  Globe,
  BookOpen,
  Clock,
  Star,
  Play,
  ChevronRight,
  Image,
  Mic,
  Video
} from 'lucide-react'

// Import family photos
import heroFamilyStories from '@/assets/hero-family-stories.jpg'
import familyTechnology from '@/assets/family-technology.jpg'
import grandfatherGranddaughter from '@/assets/grandfather-granddaughter.jpg'
import familySelfie from '@/assets/family-selfie.jpg'

// 1. HERO SECTION
const Hero = () => (
  <section className="relative bg-gradient-to-br from-background via-muted/20 to-background py-16 lg:py-24">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
        <div className="text-center lg:text-left space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground">
            Memories fade.{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              LifeScribe makes sure your family's story never does.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
            A private place for your family's photos, recipes, voices, and stories — preserved and shared for generations.
          </p>
          <Button asChild size="lg" className="text-lg px-10 py-6 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 text-brand-primary-foreground border-0 shadow-lg hover:shadow-xl transition-all">
            <Link to="/onboarding">
              Start Your Family Story <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-brand-muted to-brand-accent aspect-[4/3]">
            <img 
              src={heroFamilyStories} 
              alt="Multi-generational family sharing stories and memories together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// 2. EXPERIENCE SECTION
const ExperienceSection = () => (
  <section className="py-16 lg:py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Bring your family story to life
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            LifeScribe turns moments into a living archive your whole family can explore.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl">
                <Users className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Build a family tree you can zoom through</h3>
                <p className="text-muted-foreground leading-relaxed">Navigate through generations with an interactive family tree filled with photos and stories.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl">
                <Clock className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">See timelines filled with stories, photos, and milestones</h3>
                <p className="text-muted-foreground leading-relaxed">Watch your family's history unfold through beautifully organized timelines.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl">
                <BookOpen className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Keep recipes and heirlooms alive with their stories</h3>
                <p className="text-muted-foreground leading-relaxed">Preserve the stories behind your family's treasures, not just the objects themselves.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl">
                <Video className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Hear voices and laughter through audio and video clips</h3>
                <p className="text-muted-foreground leading-relaxed">Capture the sounds and emotions that make memories truly come alive.</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
              <img 
                src={familyTechnology} 
                alt="Family using LifeScribe to explore their family tree together"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// 3. SOCIAL PROOF ROW
const SocialProofSection = () => (
  <section className="py-12 bg-card border-y">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="flex text-brand-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-lg font-medium text-foreground">"The easiest way I've ever captured my dad's stories."</p>
          </div>
          
          <div className="flex flex-col items-center space-y-3">
            <Users className="h-8 w-8 text-brand-primary" />
            <p className="text-lg font-medium text-foreground">Trusted by families in 20+ countries</p>
          </div>
          
          <div className="flex flex-col items-center space-y-3">
            <Shield className="h-8 w-8 text-brand-primary" />
            <p className="text-lg font-medium text-foreground">Private, safe, and secure by design</p>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// 4. BENEFITS SECTION
const BenefitsSection = () => (
  <section className="py-16 lg:py-20">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Why families choose LifeScribe
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl flex items-center justify-center">
              <Globe className="h-8 w-8 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold">Stay connected across generations and continents</h3>
            <p className="text-muted-foreground leading-relaxed">Bridge distances and decades with shared family stories.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold">Make it easy for everyone to share stories, photos, and memories</h3>
            <p className="text-muted-foreground leading-relaxed">Simple tools that encourage every family member to contribute.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl flex items-center justify-center">
              <Clock className="h-8 w-8 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold">Create an archive that lasts forever</h3>
            <p className="text-muted-foreground leading-relaxed">Built to preserve your family's legacy for future generations.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-muted to-brand-accent rounded-2xl flex items-center justify-center">
              <Lock className="h-8 w-8 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold">Safe, private, family-only space</h3>
            <p className="text-muted-foreground leading-relaxed">Your memories are protected and shared only with who you choose.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// 5. EMOTIONAL SECTION
const EmotionalSection = () => (
  <section className="py-16 lg:py-20 bg-gradient-to-br from-muted/40 via-background to-muted/40">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <h2 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
          Imagine your grandchildren knowing your voice, your favourite recipe, your adventures.
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
          With LifeScribe, your family's story isn't lost — it's alive, shared, and cherished.
        </p>
        <Button asChild size="lg" className="text-lg px-10 py-6 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 text-brand-primary-foreground border-0 shadow-lg hover:shadow-xl transition-all">
          <Link to="/onboarding">
            Preserve a Memory Today <Heart className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
)

// 6. TESTIMONIALS
const TestimonialCard = ({ quote, author }: { quote: string, author: string }) => (
  <Card className="bg-card rounded-3xl shadow-lg border-0 p-8 h-full">
    <CardContent className="p-0">
      <div className="mb-6 flex justify-center">
        <Quote className="h-8 w-8 text-brand-primary" />
      </div>
      <p className="text-lg text-center mb-6 italic leading-relaxed">"{quote}"</p>
      <p className="text-center text-muted-foreground font-medium">— {author}</p>
    </CardContent>
  </Card>
)

const TestimonialsSection = () => (
  <section className="py-16 lg:py-20">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            What families are saying
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="I never thought my mum would love technology — but now she records little stories for the grandkids every week."
            author="Sarah J."
          />
          <TestimonialCard
            quote="Our family tree used to be just names. Now it's full of voices, photos, and recipes. It feels alive."
            author="Daniel B."
          />
          <TestimonialCard
            quote="It's like a private Facebook, but only for the people who really matter."
            author="Priya M."
          />
        </div>
      </div>
    </div>
  </section>
)

// 7. HOW IT WORKS
const HowItWorksSection = () => (
  <section className="py-16 lg:py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Simple, joyful, meaningful.
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-bold">Answer a guided prompt</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">Like "What was your first job?" or "Tell us about your wedding day."</p>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-bold">Add photos, recipes, or voice notes</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">Share the pictures, sounds, and details that make the story complete.</p>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-2xl font-bold">Invite family to join the story</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">Watch as your family archive grows with everyone's contributions.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// 8. FINAL CTA
const FinalCallToAction = () => (
  <section className="py-16 lg:py-20 bg-gradient-to-br from-background via-muted/20 to-background">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
          Your family story matters.
        </h2>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          Already trusted by thousands of families building their living archives.
        </p>
        <Button asChild size="lg" className="text-xl px-12 py-8 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 text-brand-primary-foreground border-0 shadow-2xl hover:shadow-3xl transition-all">
          <Link to="/onboarding">
            Begin Today with LifeScribe <ArrowRight className="ml-3 h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
)

const Footer = () => (
  <footer className="border-t bg-muted/50 backdrop-blur">
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        <div className="col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <BookHeart className="h-8 w-8 text-brand-primary" />
            <span className="text-2xl font-bold">LifeScribe</span>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Preserving family stories, one memory at a time. Connect generations through 
            shared memories in your private family archive.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Company</h3>
          <ul className="space-y-3 text-muted-foreground">
            <li><Link to="#" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link to="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
            <li><Link to="#" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Get Started</h3>
          <Button asChild variant="ghost" className="justify-start p-0 text-muted-foreground hover:text-foreground">
            <Link to="/onboarding">Create Family Account</Link>
          </Button>
        </div>
      </div>
      <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
        <p>&copy; 2025 LifeScribe. Made with ❤️ for families everywhere.</p>
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
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 shadow-sm">
    <div className="container mx-auto px-4">
      <div className="flex h-18 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <BookHeart className="h-8 w-8 text-brand-primary" />
          <span className="text-2xl font-bold">LifeScribe</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Login</Button>
            </DialogTrigger>
            <DialogContent className="p-0 border-0 bg-transparent shadow-none">
              <LoginForm />
            </DialogContent>
          </Dialog>
          <Button asChild className="rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90 text-brand-primary-foreground border-0 px-6">
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
      <SocialProofSection />
      <BenefitsSection />
      <EmotionalSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <FinalCallToAction />
      <Footer />
    </div>
  )
}