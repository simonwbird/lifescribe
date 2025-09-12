import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, HelpCircle, Image, Mic, UserPlus, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
  const [isRecording, setIsRecording] = useState(false);

  const createActions = [
    {
      id: 'share-story',
      title: 'Share a Story',
      description: 'Write about a special memory or moment',
      icon: MessageCircle,
      href: '/stories/new',
      color: 'hover:bg-sage/5'
    },
    {
      id: 'ask-family',
      title: 'Ask the Family',
      description: 'Start a conversation with a question',
      icon: HelpCircle,
      href: '/prompts',
      color: 'hover:bg-sage/5'
    },
    {
      id: 'upload-photos',
      title: 'Upload Photos',
      description: 'Add memories from your device',
      icon: Image,
      href: '/stories/new',
      color: 'hover:bg-sage/5'
    },
    {
      id: 'record-audio',
      title: 'Record Audio',
      description: 'Capture your voice telling a story',
      icon: Mic,
      action: () => setIsRecording(true),
      color: 'hover:bg-sage/5'
    },
    {
      id: 'invite-someone',
      title: 'Invite Someone',
      description: 'Add a family member to join',
      icon: UserPlus,
      href: '/family/members',
      color: 'hover:bg-sage/5'
    }
  ];

  const handleRecordToggle = () => {
    setIsRecording(!isRecording);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-h2 font-serif text-charcoal">
            What would you like to create?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {createActions.map((action) => {
            const IconComponent = action.icon;
            
            if (action.action) {
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  className={`w-full justify-start h-auto p-4 ${action.color}`}
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-sage/10">
                      <IconComponent className="w-5 h-5 text-sage" />
                    </div>
                    
                    <div className="text-left">
                      <h3 className="text-body font-medium text-charcoal">
                        {action.title}
                      </h3>
                      <p className="text-fine text-warm-gray">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              );
            }

            return (
              <Button
                key={action.id}
                asChild
                variant="ghost"
                className={`w-full justify-start h-auto p-4 ${action.color}`}
              >
                <Link to={action.href!} onClick={onClose}>
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-sage/10">
                      <IconComponent className="w-5 h-5 text-sage" />
                    </div>
                    
                    <div className="text-left">
                      <h3 className="text-body font-medium text-charcoal">
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

        {isRecording && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-background p-8 rounded-lg max-w-sm mx-4 text-center">
              <div className="animate-pulse mb-4">
                <Mic className="w-12 h-12 text-sage mx-auto" />
              </div>
              <h3 className="text-h3 font-serif text-charcoal mb-2">Recording...</h3>
              <p className="text-body text-warm-gray mb-4">
                Hold to record, release to stop
              </p>
              <Button
                variant="outline"
                onClick={handleRecordToggle}
                className="border-sage text-sage hover:bg-sage hover:text-cream"
              >
                <Play className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}