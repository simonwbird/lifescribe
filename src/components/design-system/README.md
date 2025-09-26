# Phase 1 Design System Foundation

This folder contains the foundational design system components for Lifescribe, implementing a consistent, accessible, and performance-optimized component library.

## 🎯 Goals
- **Consistency**: Uniform look and feel across the entire application
- **Speed**: Fast loading and performant components
- **Repeatability**: Reusable components that scale across features

## 📐 Design Tokens

### Spacing System (4/8/12px base)
```css
--space-1: 4px    /* Fine adjustments */
--space-2: 8px    /* Standard spacing */
--space-3: 12px   /* Medium spacing */
--space-4: 16px   /* Component padding */
--space-6: 24px   /* Section spacing */
--space-8: 32px   /* Large spacing */
```

### Border Radius
```css
--radius-sm: 8px   /* Buttons, inputs */
--radius-md: 12px  /* Cards, modals */
--radius-lg: 16px  /* Large containers */
```

### Shadows
```css
--shadow-xs: Subtle depth
--shadow-sm: Standard cards
--shadow-md: Elevated elements  
--shadow-lg: Modals, overlays
--shadow-xl: High elevation
```

### Z-Index Layers
```css
--z-1: 10  /* Dropdowns */
--z-2: 20  /* Sticky elements */
--z-3: 30  /* Overlays */
--z-4: 40  /* Modals */
--z-5: 50  /* Toasts, tooltips */
```

### Transitions
```css
--transition-fast: 150ms  /* Hover states */
--transition-base: 250ms  /* Standard interactions */
--transition-slow: 350ms  /* Complex animations */
```

## 🎨 Color Roles

### Background System
- `--bg-canvas`: Main page background
- `--bg-surface`: Card/elevated surfaces  
- `--bg-surface-secondary`: Secondary surfaces

### Brand Colors
- `--primary`: Sea-glass primary (172 77% 36%)
- `--secondary`: Neutral secondary
- `--accent`: Coral accent (12 100% 68%)

### Semantic States
- `--success`: Success states
- `--warning`: Warning states  
- `--error`: Error states

## 📝 Typography Scale

All typography follows a 4/8px baseline rhythm:

```tsx
<Display>Large hero text</Display>       // 48px/56px
<H1>Primary headings</H1>               // 40px/48px
<H2>Section headings</H2>               // 32px/40px
<H3>Subsection headings</H3>            // 24px/32px
<H4>Component titles</H4>               // 20px/28px
<H5>Small headings</H5>                 // 18px/24px
<H6>Micro headings</H6>                 // 16px/24px
<Body>Standard body text</Body>         // 16px/24px
<BodySmall>Secondary content</BodySmall> // 14px/20px
<Meta>Labels and metadata</Meta>        // 12px/16px
<Caption>Fine print</Caption>           // 10px/12px
```

## 🧩 Components

### Layout Components
- **AppHeader**: Global navigation with search
- **AppFooter**: Site footer with links
- **Navigation**: Two-hub navigation system
- **Grid/GridItem**: Responsive grid layouts

### Content Components  
- **Card**: Content containers with variants
- **EmptyState**: No-content states with actions
- **Badge**: Labels and status indicators
- **ProgressRing**: Circular progress indicators

### Interactive Components
- **Button**: Primary interactions (from ui/)
- **Input**: Form inputs (from ui/)
- **Select**: Dropdowns (from ui/)
- **Tabs**: Tab navigation (from ui/)

### Feedback Components
- **Toast**: Notifications (from ui/)
- **Tooltip**: Contextual help (from ui/)
- **Dialog/Sheet**: Modals and drawers (from ui/)
- **Skeleton**: Loading states (from ui/)

## 🏗️ Information Architecture

### Two-Hub Navigation System

#### Stories Hub
- **Prompts**: Answer guided questions
- **Quick Voice**: Voice recording interface  
- **Create**: Freeform story creation

#### Family Hub
- **People**: Manage family members
- **Family Tree**: Visual relationship mapping
- **My Life Page**: Personal profile pages

### Global Search
Available in AppHeader for searching across stories, people, and memories.

## ♿ Accessibility (WCAG 2.2 AA)

### Color Contrast
- All text meets 4.5:1 contrast ratio minimum
- Large text meets 3:1 contrast ratio minimum
- Interactive elements have sufficient contrast in all states

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order throughout components
- Focus indicators clearly visible

### Screen Reader Support
- Semantic HTML structure
- Proper ARIA labels and roles
- Descriptive alt text for images
- Live regions for dynamic content

### Typography Accessibility
- 4/8px baseline rhythm ensures consistent spacing
- Sufficient line height for readability
- Scalable text that doesn't break layouts

## 💡 Usage Examples

### Basic Layout
```tsx
import { AppHeader, AppFooter, Navigation } from '@/components/design-system'

function App() {
  return (
    <>
      <AppHeader showSearch onSearch={handleSearch} />
      <Navigation onSearch={handleSearch} />
      <main>{children}</main>
      <AppFooter />
    </>
  )
}
```

### Content Cards
```tsx
import { Card, H3, Body, Button } from '@/components/design-system'

function StoryCard() {
  return (
    <Card variant="interactive" className="p-6">
      <H3>Story Title</H3>
      <Body>Story preview text...</Body>
      <Button variant="outline">Read More</Button>
    </Card>
  )
}
```

### Empty States
```tsx
import { EmptyState } from '@/components/design-system'
import { BookOpen } from 'lucide-react'

function NoStories() {
  return (
    <EmptyState
      icon={<BookOpen className="h-6 w-6" />}
      title="No stories yet"
      description="Get started by answering your first prompt or recording a voice memory."
      action={{
        label: "Browse Prompts",
        onClick: () => navigate('/prompts')
      }}
    />
  )
}
```

## 🔄 Component Documentation

Each component includes:
- **Usage guidelines**: When and how to use
- **Do's and Don'ts**: Best practices  
- **Code examples**: Implementation patterns
- **Accessibility notes**: Screen reader support
- **Performance tips**: Optimization guidelines

This ensures consistent implementation across the entire application while maintaining high quality and accessibility standards.