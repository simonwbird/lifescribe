import { HelpCircle, Book, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Help() {
  const helpSections = [
    {
      title: 'Getting Started',
      icon: Book,
      description: 'Learn the basics of LifeScribe',
      items: [
        { label: 'Quick Start Guide', link: '#quick-start' },
        { label: 'Creating Your First Story', link: '#first-story' },
        { label: 'Adding Family Members', link: '#add-members' },
        { label: 'Organizing Photos', link: '#organize-photos' },
      ],
    },
    {
      title: 'Features',
      icon: HelpCircle,
      description: 'Explore what you can do',
      items: [
        { label: 'Stories & Memories', link: '#stories' },
        { label: 'Family Tree', link: '#family-tree' },
        { label: 'Media Library', link: '#media' },
        { label: 'Events & Timeline', link: '#events' },
        { label: 'SafeBox Vault', link: '#vault' },
        { label: 'Weekly Digest', link: '#digest' },
      ],
    },
    {
      title: 'Support',
      icon: MessageCircle,
      description: 'Get help when you need it',
      items: [
        { label: 'FAQ', link: '#faq' },
        { label: 'Video Tutorials', link: '#tutorials' },
        { label: 'Community Forum', link: '#forum', external: true },
        { label: 'Contact Support', link: 'mailto:support@lifescribe.app', external: true },
      ],
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl" id="main-content">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" aria-hidden="true" />
          Help & Support
        </h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to make the most of LifeScribe
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.link}
                        className="text-sm hover:text-primary transition-colors flex items-center gap-2"
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                      >
                        {item.label}
                        {item.external && (
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" aria-hidden="true" />
            Need Personal Assistance?
          </CardTitle>
          <CardDescription>
            Our support team is here to help you with any questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We typically respond within 24 hours during business days
          </p>
          <Button asChild>
            <a href="mailto:support@lifescribe.app">
              Contact Support Team
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
