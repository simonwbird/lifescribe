import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none dark:prose-invert">
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing and using this service, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>

              <h2>Use License</h2>
              <p>
                Permission is granted to temporarily use our service for personal, family use only. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul>
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained in our service</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>

              <h2>User Content</h2>
              <p>
                You retain ownership of all content you submit, post, or display on our service. 
                By submitting content, you grant us a license to use, modify, and display that content 
                in connection with our service.
              </p>

              <h2>Privacy and Family Data</h2>
              <p>
                You are responsible for managing access to your family space and ensuring appropriate 
                privacy settings. We are not responsible for content shared within family groups.
              </p>

              <h2>Prohibited Uses</h2>
              <p>You may not use our service:</p>
              <ul>
                <li>for any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>to infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              </ul>

              <h2>Disclaimer</h2>
              <p>
                The information on this service is provided on an 'as is' basis. To the fullest extent 
                permitted by law, this Company excludes all representations, warranties, conditions and terms.
              </p>

              <h2>Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at legal@familyhub.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}