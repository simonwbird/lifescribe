import { BugChangelog } from '@/components/BugChangelog';

export default function BugChangelogPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bug Resolution Changelog</h1>
        <p className="text-muted-foreground">
          Track resolved bugs and recent changes for transparency.
        </p>
      </div>
      
      <BugChangelog />
    </div>
  );
}