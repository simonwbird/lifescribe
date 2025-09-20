import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Flag, Database, Shield, Bell, Bug, Users } from 'lucide-react';
import { BugChangelog } from '@/components/BugChangelog';

export default function AdminConfig() {
  const configSections = [
    {
      title: 'Feature Flags',
      description: 'Manage feature rollouts and experiments',
      icon: Flag,
      status: 'Active',
      path: '/admin/feature-flags',
      items: ['Bug reporting system', 'AI task automation', 'Advanced analytics']
    },
    {
      title: 'Bug Management',
      description: 'Bug reporting and resolution system',
      icon: Bug,
      status: 'Active',
      path: '/admin/bugs',
      items: ['Automated bug capture', 'Loveable AI integration', 'QA workflow']
    },
    {
      title: 'User Management',
      description: 'Admin access and user permissions',
      icon: Users,
      status: 'Active',
      path: '/admin/users',
      items: ['Super admin controls', 'Role assignment', 'Bug tester access']
    },
    {
      title: 'Family Management',
      description: 'Family oversight and analytics',
      icon: Users,
      status: 'Active',
      path: '/admin/families',
      items: ['Family health monitoring', 'Usage analytics', 'Member management']
    },
    {
      title: 'Security & Compliance',
      description: 'Audit logs and security monitoring',
      icon: Shield,
      status: 'Active',
      path: '/admin/audit',
      items: ['Audit trail integrity', 'Admin access tracking', 'Security events']
    },
    {
      title: 'Notifications',
      description: 'System notifications and alerts',
      icon: Bell,
      status: 'Configured',
      path: '/admin/digest',
      items: ['Bug resolution alerts', 'Weekly digests', 'System notifications']
    },
    {
      title: 'Database Health',
      description: 'Database monitoring and optimization',
      icon: Database,
      status: 'Monitoring',
      path: '#',
      items: ['RLS policy monitoring', 'Query performance', 'Storage optimization']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Configured':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Monitoring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">System Configuration</h1>
          <p className="text-muted-foreground">
            Manage feature flags, system settings, and monitor platform health
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configSections.map((section) => (
          <Card key={section.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
                <Badge className={getStatusColor(section.status)}>
                  {section.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
              <div className="space-y-2 mb-4">
                {section.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    {item}
                  </div>
                ))}
              </div>
              {section.path !== '#' ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.href = section.path}
                >
                  Configure
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Coming Soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Bug Reporting System</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Loveable AI Integration</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database RLS</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Secured
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Notification System</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit Logging</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  Recording
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <BugChangelog limit={5} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={() => window.location.href = '/admin/bugs'}>
              <Bug className="w-4 h-4 mr-2" />
              Bug Inbox
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin/feature-flags'}>
              <Flag className="w-4 h-4 mr-2" />
              Feature Flags
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin/users'}>
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin/families'}>
              <Users className="w-4 h-4 mr-2" />
              Families
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin/digest'}>
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}