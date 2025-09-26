import { Button } from '@/components/ui/button'

interface SkipLinkProps {
  href: string
  children: string
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] bg-background border-2 border-primary"
    >
      <a href={href}>
        {children}
      </a>
    </Button>
  )
}