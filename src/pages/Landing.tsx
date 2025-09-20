import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { BookHeart, ArrowRight, Heart, Users, TreePine, Clock, Star, ChevronRight, Home, Lock, Globe, Plus } from 'lucide-react';
// Import family photos
import heroFamilyStories from '@/assets/hero-family-stories.jpg';
import familyTechnology from '@/assets/family-technology.jpg';
import grandfatherGranddaughter from '@/assets/grandfather-granddaughter.jpg';
import familySelfie from '@/assets/family-selfie.jpg';

// HERO SECTION
const Hero = () => {
  return <section className="relative bg-gradient-paper min-h-[60vh] flex items-center">
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <p className="text-lg font-sans text-muted-foreground italic">
              Where your family stories live forever.
            </p>
            <h1 className="text-hero lg:text-6xl font-serif font-bold leading-tight text-foreground">
              Some memories fade.{" "}
              <span className="text-accent-500">
                Yours don't have to.
              </span>
            </h1>
          </div>
          <p className="text-xl font-sans text-muted-foreground leading-relaxed max-w-2xl">
            LifeScribe is a private home for the memories that matter most — the voices, photos, recipes, and adventures you never want to lose.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-700 hover:bg-brand-600 text-white shadow-photo transition-all duration-300 hover:shadow-lg">
              <Link to="/login?redirect=onboarding">
                <Plus className="mr-2 h-5 w-5" />
                Create Family Space
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 text-brand-700 border-brand-700 hover:bg-brand-700 hover:text-white">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
          <div className="flex gap-2 justify-center lg:justify-start">
            <span className="chip">Private by default</span>
            <span className="chip">Family-only access</span>
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden shadow-photo bg-card border border-border">
            <img src={heroFamilyStories} alt="Multi-generational family sharing stories and memories together around a table" className="w-full h-full object-cover aspect-[4/3]" />
          </div>
          {/* Decorative photo corner */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-card border border-border rounded-lg shadow-frame transform rotate-6 opacity-80"></div>
        </div>
        </div>
      </div>
    </section>;
};

// EXPERIENCE SECTION
const ExperienceSection = () => <section className="py-20 bg-neutral-section relative">
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
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <TreePine className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Tree that grows with your family</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">"+3 new relatives added this week"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <Clock className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Timelines you can wander</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">"Stories grouped by decade & place"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <BookHeart className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Recipes & heirlooms with their stories</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">"Photo + origin + who it came from"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-card rounded-lg shadow-frame border border-border">
              <div className="p-3 bg-neutral-canvas rounded-lg">
                <Heart className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">Voices you can replay</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">"1-tap voice notes, auto-transcribed"</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden shadow-photo aspect-[4/3] border border-border">
              <img src={familyTechnology} alt="Family using LifeScribe to explore their memories together on a tablet" className="w-full h-full object-cover" />
            </div>
            {/* Polaroid-style decoration */}
            <div className="absolute -top-3 -left-3 w-20 h-24 bg-card border border-border rounded-sm shadow-frame transform -rotate-12"></div>
          </div>
        </div>
      </div>
    </div>
  </section>;

// BENEFITS SECTION
const BenefitsSection = () => <section className="py-20 bg-gradient-paper">
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
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-foreground">Grandparents sharing stories the kids will listen to again and again</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Bridge generations with stories that captivate and connect.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                <BookHeart className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-foreground">Old photos no longer tucked away in dusty boxes</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Bring forgotten memories back to life where everyone can see them.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-foreground">Family scattered across the world, connected in one place</h3>
                <p className="text-muted-foreground font-sans leading-relaxed">Distance can't separate hearts when memories bring you together.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-neutral-canvas rounded-full flex items-center justify-center flex-shrink-0">
                
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
  </section>;

// EMOTIONAL MOMENT SECTION
const EmotionalSection = () => <section className="py-20 bg-neutral-section relative overflow-hidden">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-hero font-serif font-bold leading-tight text-foreground">
          Imagine your granddaughter discovering the recipe you cooked every Sunday, 
          <span className="text-accent-500 italic"> in your handwriting.</span> 
          Or hearing your laugh for the very first time.
        </h2>
        <p className="text-body font-sans text-muted-foreground leading-relaxed max-w-4xl mx-auto">
          LifeScribe makes sure the details — the ones that make life beautiful — are never forgotten.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-700 hover:bg-brand-600 text-white shadow-photo transition-all duration-300 hover:shadow-lg">
          <Link to="/onboarding">
            Preserve a Memory Today <Heart className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
    {/* Subtle background decoration */}
    <div className="absolute top-10 right-10 w-32 h-40 bg-card border border-border rounded-lg shadow-frame transform rotate-12 opacity-30"></div>
    <div className="absolute bottom-10 left-10 w-24 h-32 bg-card border border-border rounded-lg shadow-frame transform -rotate-6 opacity-30"></div>
  </section>;

// TESTIMONIALS
const TestimonialCard = ({
  quote,
  author
}: {
  quote: string;
  author: string;
}) => <Card className="bg-card rounded-lg shadow-photo border border-border p-6 h-full relative">
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
  </Card>;
const TestimonialsSection = () => <section className="py-20 bg-gradient-paper">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h1 font-serif font-semibold mb-6 text-foreground">
            Families are already writing their next chapters
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard quote="I never thought my mum would love technology — but she records little stories for the grandkids every week. They can't wait to listen." author="Sarah A., granddaughter" />
          <TestimonialCard quote="Our family tree used to be just names. Now it's voices, recipes, and photos. It feels alive." author="Daniel B., father" />
          <TestimonialCard quote="It's like a private scrapbook that everyone can add to. But safer, and it will never get lost." author="Priya M., daughter" />
        </div>
      </div>
    </div>
  </section>;
const PrivacySection = () => <section className="py-16 bg-neutral-section">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-serif font-semibold mb-8 text-foreground">Why it's safe</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <Lock className="h-8 w-8 text-brand-700 mx-auto" />
            <p className="font-sans text-sm text-muted-foreground">Private by default</p>
          </div>
          <div className="space-y-2">
            <Users className="h-8 w-8 text-brand-700 mx-auto" />
            <p className="font-sans text-sm text-muted-foreground">Invite-only</p>
          </div>
          <div className="space-y-2">
            <ArrowRight className="h-8 w-8 text-brand-700 mx-auto" />
            <p className="font-sans text-sm text-muted-foreground">Export anytime</p>
          </div>
          <div className="space-y-2">
            <Home className="h-8 w-8 text-brand-700 mx-auto" />
            <p className="font-sans text-sm text-muted-foreground">You own your data</p>
          </div>
        </div>
      </div>
    </div>
  </section>;

// HOW IT WORKS
const HowItWorksSection = () => <section className="py-20 bg-neutral-canvas" id="how-it-works">
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h1 font-serif font-semibold mb-6 text-foreground">
            Simple, like telling a story around the table.
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-700 rounded-lg flex items-center justify-center text-white text-2xl font-serif font-bold shadow-frame">
              1
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Answer a gentle prompt</h3>
            <p className="text-lg font-sans text-muted-foreground leading-relaxed">Like "What was your first job?" or something that sparks a memory.</p>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-700 rounded-lg flex items-center justify-center text-white text-2xl font-serif font-bold shadow-frame">
              2
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Snap a photo or scan a document</h3>
            <p className="text-lg font-sans text-muted-foreground leading-relaxed">No scanning skills needed—snap a photo. We clean it up.</p>
          </div>
          
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-brand-700 rounded-lg flex items-center justify-center text-white text-2xl font-serif font-bold shadow-frame">
              3
            </div>
            <h3 className="text-2xl font-serif font-semibold text-foreground">Invite family to listen, share, and add their own</h3>
            <p className="text-lg font-sans text-muted-foreground leading-relaxed">Watch as your family archive grows with everyone's contributions.</p>
          </div>
        </div>
      </div>
    </div>
  </section>;

// FINAL CTA
const FinalCallToAction = () => <section className="py-20 bg-gradient-paper relative">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-hero font-serif font-bold leading-tight text-foreground">
          Your story is a gift.{" "}
          <span className="text-accent-500">Pass it on.</span>
        </h2>
        <p className="text-body font-sans text-muted-foreground leading-relaxed max-w-3xl mx-auto">
          Join the families building their own living archives with LifeScribe.
        </p>
        <Button asChild size="lg" className="text-lg px-8 py-6 rounded-md font-sans font-medium bg-brand-700 hover:bg-brand-600 text-white shadow-photo transition-all duration-300 hover:shadow-lg">
          <Link to="/onboarding">
            Start Your Family Album <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
    {/* Decorative elements */}
    <div className="absolute top-16 left-16 w-20 h-20 bg-card border border-border rounded-full shadow-frame opacity-40"></div>
    <div className="absolute bottom-16 right-16 w-16 h-16 bg-card border border-border rounded-lg shadow-frame transform rotate-45 opacity-40"></div>
  </section>;
const Footer = () => <footer className="border-t bg-card/50 backdrop-blur">
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
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
            <li><Link to="#" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-serif font-semibold mb-4 text-foreground">Examples</h3>
          <div className="space-y-3">
            <Button asChild variant="ghost" className="justify-start p-0 text-muted-foreground hover:text-foreground font-sans">
              <Link to="/demo">Family Examples</Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start p-0 text-muted-foreground hover:text-foreground font-sans">
              <Link to="/elder-resources">For Elders</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
        <p className="font-sans">&copy; 2025 LifeScribe. Made with ❤️ for families everywhere.</p>
      </div>
    </div>
  </footer>;
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate('/home');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };
  return <Card className="w-full max-w-md shadow-photo border border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif">LifeScribe</CardTitle>
        <CardDescription className="font-sans">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Sign In - Primary */}
        <Button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full h-12 text-base" aria-label="Continue with Google">
          {loading ? <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Connecting to Google...
            </> : <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </>}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Fast and secure</p>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-sans">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-md" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-sans">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="rounded-md" />
          </div>
          {error && <Alert variant="destructive" className="rounded-md">
              <AlertDescription className="font-sans">{error}</AlertDescription>
            </Alert>}
          <Button type="submit" className="w-full rounded-md font-sans" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-sans">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By continuing, you agree to our Terms and Privacy.
        </p>
      </CardContent>
    </Card>;
};
const LandingHeader = () => <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95 shadow-sm">
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
  </header>;
export default function Landing() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  return <div className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <ExperienceSection />
      <BenefitsSection />
      <EmotionalSection />
      <TestimonialsSection />
      <PrivacySection />
      <HowItWorksSection />
      <FinalCallToAction />
      <Footer />
    </div>;
}