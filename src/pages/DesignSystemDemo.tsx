import { useState } from 'react'
import { 
  AppHeader,
  AppFooter, 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  EmptyState,
  ProgressRing,
  Badge,
  Grid,
  GridItem,
  Navigation,
  Display,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  BodySmall,
  Meta,
  Caption,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Skeleton,
  toast,
  useToast
} from '@/components/design-system'
import { BookOpen, Users, Star, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default function DesignSystemDemo() {
  const [progress, setProgress] = useState(65)
  const { toast: showToast } = useToast()

  const handleToast = () => {
    showToast({
      title: "Design System Demo",
      description: "All components are working correctly!",
    })
  }

  const handleSearch = (query: string) => {
    console.log('Search:', query)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header is rendered globally via App.tsx */}

      {/* Navigation */}
      <div className="border-b px-6 py-4">
        <Navigation onSearch={handleSearch} />
      </div>

      <main className="container max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Typography Showcase */}
        <section className="space-y-6">
          <H1>Typography Scale</H1>
          <Body>All typography follows a 4/8px baseline rhythm for consistency and readability.</Body>
          
          <Grid cols={2} gap="lg" responsive={{ sm: 1, lg: 2 }}>
            <GridItem>
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>Headings</CardTitle>
                  <CardDescription>Semantic heading hierarchy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Display>Display Text</Display>
                  <H1>Heading 1</H1>
                  <H2>Heading 2</H2>
                  <H3>Heading 3</H3>
                  <H4>Heading 4</H4>
                  <H5>Heading 5</H5>
                  <H6>Heading 6</H6>
                </CardContent>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>Body & Meta</CardTitle>
                  <CardDescription>Content and supporting text</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Body>This is standard body text with proper line height and spacing for optimal readability.</Body>
                  <BodySmall>This is smaller body text used for secondary content and descriptions.</BodySmall>
                  <Meta>Meta Text</Meta>
                  <Caption>Caption text for fine print</Caption>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>
        </section>

        {/* Color System */}
        <section className="space-y-6">
          <H1>Color System</H1>
          <Grid cols={3} gap="md" responsive={{ sm: 1, md: 2, lg: 3 }}>
            <GridItem>
              <Card padding="md">
                <CardHeader>
                  <CardTitle>Primary Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-12 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-body-sm font-medium">Primary</div>
                  <div className="h-12 bg-secondary rounded-md flex items-center justify-center text-secondary-foreground text-body-sm font-medium">Secondary</div>
                  <div className="h-12 bg-accent rounded-md flex items-center justify-center text-accent-foreground text-body-sm font-medium">Accent</div>
                </CardContent>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card padding="md">
                <CardHeader>
                  <CardTitle>Semantic Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-12 bg-success rounded-md flex items-center justify-center text-success-foreground text-body-sm font-medium">Success</div>
                  <div className="h-12 bg-warning rounded-md flex items-center justify-center text-warning-foreground text-body-sm font-medium">Warning</div>
                  <div className="h-12 bg-error rounded-md flex items-center justify-center text-error-foreground text-body-sm font-medium">Error</div>
                </CardContent>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card padding="md">
                <CardHeader>
                  <CardTitle>Neutral Grays</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-12 bg-background border rounded-md flex items-center justify-center text-foreground text-body-sm font-medium">Background</div>
                  <div className="h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-body-sm font-medium">Muted</div>
                  <div className="h-12 bg-card border rounded-md flex items-center justify-center text-card-foreground text-body-sm font-medium">Card</div>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>
        </section>

        {/* Components Showcase */}
        <section className="space-y-6">
          <H1>Components</H1>
          
          {/* Buttons & Form Elements */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Interactive Elements</CardTitle>
              <CardDescription>Buttons, inputs, and form components</CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={2} gap="lg" responsive={{ sm: 1, lg: 2 }}>
                <GridItem className="space-y-4">
                  <H4>Buttons</H4>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleToast}>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </GridItem>
                
                <GridItem className="space-y-4">
                  <H4>Form Elements</H4>
                  <div className="space-y-3">
                    <Input placeholder="Enter text..." />
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </GridItem>
              </Grid>
            </CardContent>
          </Card>

          {/* Cards */}
          <Grid cols={3} gap="md" responsive={{ sm: 1, md: 2, lg: 3 }}>
            <GridItem>
              <Card variant="default" padding="md">
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>Standard card styling</CardDescription>
                </CardHeader>
                <CardContent>
                  <Body>This is a default card with standard styling and shadows.</Body>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">Action</Button>
                </CardFooter>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card variant="elevated" padding="md">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>Enhanced shadow</CardDescription>
                </CardHeader>
                <CardContent>
                  <Body>This card has elevated styling with more prominent shadows.</Body>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">Action</Button>
                </CardFooter>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card variant="interactive" padding="md">
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>Hover effects</CardDescription>
                </CardHeader>
                <CardContent>
                  <Body>This card responds to hover with shadow transitions.</Body>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">Action</Button>
                </CardFooter>
              </Card>
            </GridItem>
          </Grid>

          {/* Badges & Progress */}
          <Grid cols={2} gap="md" responsive={{ sm: 1, lg: 2 }}>
            <GridItem>
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>Status indicators and labels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge size="sm">Small</Badge>
                    <Badge size="md">Medium</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </CardContent>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>Progress Ring</CardTitle>
                  <CardDescription>Circular progress indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <ProgressRing progress={progress} size="sm" showLabel />
                    <ProgressRing progress={progress} size="md" showLabel />
                    <ProgressRing progress={progress} size="lg" showLabel />
                  </div>
                  <div className="mt-4">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>

          {/* Empty State */}
          <Card padding="none">
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="No content found"
              description="This is an example empty state with an action button to guide users."
              action={{
                label: "Get Started",
                onClick: handleToast
              }}
            />
          </Card>

          {/* Avatar & Skeleton */}
          <Grid cols={2} gap="md" responsive={{ sm: 1, lg: 2 }}>
            <GridItem>
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>Avatars</CardTitle>
                  <CardDescription>User profile images</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>CD</AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>Loading States</CardTitle>
                  <CardDescription>Skeleton components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>

          {/* Tabs */}
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Tab Navigation</CardTitle>
              <CardDescription>Organized content sections</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="components">Components</TabsTrigger>
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                  <Card padding="md">
                    <CardContent>
                      <Body>This design system provides a complete foundation for building consistent, accessible, and performant user interfaces.</Body>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="components" className="mt-6">
                  <Card padding="md">
                    <CardContent>
                      <Body>All components follow WCAG 2.2 AA accessibility standards and are built with semantic HTML.</Body>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="tokens" className="mt-6">
                  <Card padding="md">
                    <CardContent>
                      <Body>Design tokens ensure consistency across spacing (4/8/12px), colors (HSL), shadows (xs-xl), and typography (4/8px baseline).</Body>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Status Section */}
        <section className="space-y-6">
          <H1>Phase 1 Completion Status</H1>
          <Grid cols={1} gap="md">
            <GridItem>
              <Card variant="elevated" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Design System Foundation Complete
                  </CardTitle>
                  <CardDescription>All Phase 1 deliverables have been implemented</CardDescription>
                </CardHeader>
                <CardContent>
                  <Grid cols={2} gap="md" responsive={{ sm: 1, lg: 2 }}>
                    <GridItem className="space-y-3">
                      <H4 className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Tokenized System
                      </H4>
                      <BodySmall>✅ Spacing (4/8/12px base)</BodySmall>
                      <BodySmall>✅ Radii (8, 16px)</BodySmall>
                      <BodySmall>✅ Shadow (xs–lg)</BodySmall>
                      <BodySmall>✅ Z-index (1–5)</BodySmall>
                      <BodySmall>✅ Transitions (150/250ms)</BodySmall>
                      <BodySmall>✅ Color roles (semantic HSL)</BodySmall>
                      <BodySmall>✅ Typography (4/8px baseline)</BodySmall>
                    </GridItem>
                    
                    <GridItem className="space-y-3">
                      <H4 className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Components v1
                      </H4>
                      <BodySmall>✅ AppHeader, AppFooter</BodySmall>
                      <BodySmall>✅ Card, Button, Input, Select</BodySmall>
                      <BodySmall>✅ Tabs, Tooltip, Modal/Sheet</BodySmall>
                      <BodySmall>✅ Toast, EmptyState, Avatar</BodySmall>
                      <BodySmall>✅ ProgressRing, Badge, Grid</BodySmall>
                      <BodySmall>✅ Skeleton, Typography</BodySmall>
                    </GridItem>
                  </Grid>
                  
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <H5 className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-warning" />
                      Information Architecture
                    </H5>
                    <BodySmall>✅ Two-hub navigation: Stories (Prompts, Quick Voice, Create) and Family (People, Tree, MyLifePage)</BodySmall>
                    <BodySmall>✅ Global search integration</BodySmall>
                    <BodySmall>✅ WCAG 2.2 AA compliant color contrast</BodySmall>
                    <BodySmall>✅ Component documentation with usage examples</BodySmall>
                  </div>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>
        </section>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  )
}