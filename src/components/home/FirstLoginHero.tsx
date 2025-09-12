import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, MessageCircle, UserPlus, Image } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FirstLoginHeroProps {
  completedSteps: string[];
  onStepComplete: (step: string) => void;
}

export default function FirstLoginHero({ completedSteps, onStepComplete }: FirstLoginHeroProps) {
  const setupSteps = [
    { id: 'profile_photo', label: 'Add profile photo', completed: completedSteps.includes('profile_photo') },
    { id: 'invite_person', label: 'Invite 1 person', completed: completedSteps.includes('invite_person') },
    { id: 'post_story', label: 'Post 1 story', completed: completedSteps.includes('post_story') },
    { id: 'upload_photos', label: 'Upload 3 photos', completed: completedSteps.includes('upload_photos') }
  ];

  const completedCount = setupSteps.filter(step => step.completed).length;
  const progressPercentage = (completedCount / setupSteps.length) * 100;

  return (
    <div className="text-center space-y-8">
      {/* Hero Actions */}
      <div>
        <h1 className="text-hero font-serif text-charcoal mb-6">
          Welcome to your family's story
        </h1>
        <p className="text-body text-warm-gray mb-8 max-w-2xl mx-auto">
          Start building your family's living archive with these simple first steps.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Button
            asChild
            size="lg"
            className="h-auto p-6 bg-sage hover:bg-sage/90 text-cream"
          >
            <Link to="/stories/new">
              <div className="flex flex-col items-center space-y-3">
                <MessageCircle className="w-8 h-8" />
                <div>
                  <h3 className="text-body font-medium mb-1">Tell Your First Story</h3>
                  <p className="text-fine opacity-90">Share a favorite memory</p>
                </div>
              </div>
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-auto p-6 border-sage/30 hover:bg-sage/5"
          >
            <Link to="/family/members">
              <div className="flex flex-col items-center space-y-3">
                <UserPlus className="w-8 h-8 text-sage" />
                <div>
                  <h3 className="text-body font-medium mb-1 text-charcoal">Invite a Family Member</h3>
                  <p className="text-fine text-warm-gray">Share the joy together</p>
                </div>
              </div>
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-auto p-6 border-sage/30 hover:bg-sage/5"
          >
            <Link to="/stories/new">
              <div className="flex flex-col items-center space-y-3">
                <Image className="w-8 h-8 text-sage" />
                <div>
                  <h3 className="text-body font-medium mb-1 text-charcoal">Scan a Photo</h3>
                  <p className="text-fine text-warm-gray">Bring old memories online</p>
                </div>
              </div>
            </Link>
          </Button>
        </div>
      </div>

      {/* Setup Progress */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-h3 font-serif text-charcoal">
            Your Family Hub is {Math.round(progressPercentage)}% set up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="space-y-3">
            {setupSteps.map((step) => (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-sage text-cream' 
                    : 'border-2 border-warm-gray'
                }`}>
                  {step.completed && <Check className="w-3 h-3" />}
                </div>
                <span className={`text-body ${
                  step.completed ? 'text-sage' : 'text-charcoal'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}