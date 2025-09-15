import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none dark:prose-invert">
              <h2>Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, 
                share family stories, upload media, or contact us for support.
              </p>

              <h2>How We Use Your Information</h2>
              <ul>
                <li>To provide, maintain, and improve our services</li>
                <li>To process transactions and send related information</li>
                <li>To send you technical notices and support messages</li>
                <li>To communicate with you about products, services, and events</li>
              </ul>

              <h2>Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy.
              </p>

              <h2>Family Data Privacy</h2>
              <p>
                Your family stories, photos, and personal information are private to your family group. 
                Only invited family members can access your shared content. You control who can see your stories 
                through privacy settings.
              </p>

              <h2>Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2>Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. You can 
                export your data or delete your account at any time from your profile settings.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at privacy@familyhub.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}