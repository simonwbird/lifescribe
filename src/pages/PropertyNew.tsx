import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { PropertyWizard } from '@/components/properties/PropertyWizard'

export default function PropertyNew() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <PropertyWizard />
        </main>
      </div>
    </AuthGate>
  )
}