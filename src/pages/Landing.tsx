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
  Quote
} from 'lucide-react'

// Import family photos
import heroFamilyStories from '@/assets/hero-family-stories.jpg'
import familyTechnology from '@/assets/family-technology.jpg'
import grandfatherGranddaughter from '@/assets/grandfather-granddaughter.jpg'
import familySelfie from '@/assets/family-selfie.jpg'

const Hero = () => (
  <section className="relative bg-gradient-to-br from-rose-50/80 via-background to-amber-50/60 py-20 lg:py-32">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Preserve your family's{" "}
            <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
              stories for generations
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            LifeScribe is a private family memory book where everyone can share stories, photos, and wisdom — 
            safely kept for the future.
          </p>
          <Button asChild size="lg" className="text-lg px-10 py-6 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
            <Link to="/onboarding">
              Start Your Family Archive <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-rose-100 to-amber-100 aspect-[4/3]">
            <img 
              src={heroFamilyStories} 
              alt="Multi-generational family sharing stories and memories together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon
}: {
  title: string
  description: string
  icon: React.ComponentType<any>
}) => (
  <Card className="bg-white rounded-3xl shadow-lg border-0 hover:shadow-xl transition-all p-8 h-full">
    <CardContent className="p-0 text-center">
      <div className="mb-6 flex justify-center">
        <div className="p-4 bg-gradient-to-br from-rose-100 to-amber-100 rounded-2xl">
          <Icon className="h-8 w-8 text-gradient" style={{color: '#f43f5e'}} />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </CardContent>
  </Card>
)

const FeaturesSection = () => (
  <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-slate-50/50">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything your family needs to stay connected
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Capture Memories"
            description="Answer fun prompts about your life, upload photos and videos, and create lasting memories that your family will treasure forever."
            icon={Camera}
          />
          <FeatureCard
            title="Private & Secure"
            description="Your family's stories are protected with bank-level security. Only invited family members can access your memories — no ads, no data mining."
            icon={Lock}
          />
          <FeatureCard
            title="Connect Generations"
            description="Bring children, parents, and grandparents together in one shared space where everyone can contribute to your family's story."
            icon={Heart}
          />
        </div>
        
        {/* Photo showcase section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-[4/3]">
            <img 
              src={familyTechnology} 
              alt="Family using technology together to share memories"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-[4/3]">
            <img 
              src={grandfatherGranddaughter} 
              alt="Grandfather and granddaughter looking through photo albums"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-[4/3]">
            <img 
              src={familySelfie} 
              alt="Multi-generational family taking a happy selfie together"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
)

const TestimonialCard = ({ quote, author }: { quote: string, author: string }) => (
  <Card className="bg-white rounded-3xl shadow-lg border-0 p-8 h-full">
    <CardContent className="p-0">
      <div className="mb-6 flex justify-center">
        <Quote className="h-8 w-8 text-rose-400" />
      </div>
      <p className="text-lg text-center mb-6 italic leading-relaxed">"{quote}"</p>
      <p className="text-center text-muted-foreground font-medium">— {author}</p>
    </CardContent>
  </Card>
)

const TestimonialsSection = () => (
  <section className="py-20 lg:py-32">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Families love LifeScribe
          </h2>
          <p className="text-lg text-muted-foreground">
            See what families are saying about preserving their memories together
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="It feels like having a digital family book we can all write in."
            author="Sarah M."
          />
          <TestimonialCard
            quote="My kids love asking grandma questions and seeing her answers."
            author="Michael R."
          />
          <TestimonialCard
            quote="LifeScribe made us laugh and cry together — in the best way."
            author="Jennifer L."
          />
        </div>
      </div>
    </div>
  </section>
)

const CallToAction = () => (
  <section className="py-20 lg:py-32 bg-gradient-to-br from-rose-50/80 via-background to-amber-50/60">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-4xl md:text-6xl font-bold mb-6">
        Start your family archive{" "}
        <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
          today
        </span>
      </h2>
      <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
        Join families worldwide who are preserving their stories for future generations. 
        Create your private family space in just minutes.
      </p>
      <Button asChild size="lg" className="text-xl px-12 py-8 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all">
        <Link to="/onboarding">
          Start Your Family Archive <ArrowRight className="ml-3 h-6 w-6" />
        </Link>
      </Button>
    </div>
  </section>
)

const Footer = () => (
  <footer className="border-t bg-slate-50/50 backdrop-blur">
    <div className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        <div className="col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <BookHeart className="h-8 w-8 text-rose-500" />
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
            <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
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
  <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-sm">
    <div className="container mx-auto px-4">
      <div className="flex h-18 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <BookHeart className="h-8 w-8 text-rose-500" />
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
          <Button asChild className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 px-6">
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
      <FeaturesSection />
      <TestimonialsSection />
      <CallToAction />
      <Footer />
    </div>
  )
}