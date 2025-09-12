import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, HelpCircle, Image, Mic, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickStart() {
  const quickActions = [
    {
      id: 'share-story',
      title: 'Share a Story',
      description: 'Tell your family about a special memory',
      icon: MessageCircle,
      href: '/stories/new',
      color: 'bg-sage hover:bg-sage/90'
    },
    {
      id: 'ask-family',
      title: 'Ask the Family',
      description: 'Start a conversation with a question',
      icon: HelpCircle,
      href: '/prompts',
      color: 'bg-sage hover:bg-sage/90'
    },
    {
      id: 'upload-photos',
      title: 'Upload Photos',
      description: 'Add memories from your camera roll',
      icon: Image,
      href: '/stories/new',
      color: 'bg-sage hover:bg-sage/90'
    },
    {
      id: 'record-audio',
      title: 'Record Audio',
      description: 'Capture your voice telling a story',
      icon: Mic,
      href: '/stories/new',
      color: 'bg-sage hover:bg-sage/90'
    },
    {
      id: 'invite-someone',
      title: 'Invite Someone',
      description: 'Add a family member to your circle',
      icon: UserPlus,
      href: '/family/members',
      color: 'bg-sage hover:bg-sage/90'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3 font-serif text-charcoal">Quick Start</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Button
                key={action.id}
                asChild
                variant="outline"
                className="h-auto p-6 text-left hover:border-sage/50 hover:bg-sage/5 transition-all duration-200"
              >
                <Link to={action.href}>
                  <div className="flex flex-col items-start space-y-3">
                    <div className="p-3 rounded-lg bg-sage/10">
                      <IconComponent className="w-6 h-6 text-sage" />
                    </div>
                    
                    <div>
                      <h3 className="text-body font-medium text-charcoal mb-1">
                        {action.title}
                      </h3>
                      <p className="text-fine text-warm-gray">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}