import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Heart, Camera, Users, TreePine, ChefHat } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { useNavigate } from 'react-router-dom'

interface FirstActionPromptsProps {
  type: 'story' | 'recipe' | 'person' | 'thing'
  familyId: string
  onComplete: () => void
}

export default function FirstActionPrompts({ type, familyId, onComplete }: FirstActionPromptsProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  // Story state
  const [storyTitle, setStoryTitle] = useState('')
  const [storyContent, setStoryContent] = useState('')

  // Recipe state
  const [recipeTitle, setRecipeTitle] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState('')
  const [recipeSteps, setRecipeSteps] = useState('')

  // Person state
  const [personName, setPersonName] = useState('')
  const [personRelation, setPersonRelation] = useState('')
  const [personBirthYear, setPersonBirthYear] = useState('')

  const prompts = {
    story: [
      {
        title: "What's your happiest childhood memory?",
        description: "Think about a moment that still makes you smile",
        icon: Heart,
        placeholder: "I remember the summer when..."
      },
      {
        title: "Tell us about a family tradition",
        description: "Something special your family does together",
        icon: Sparkles,
        placeholder: "Every year we would..."
      },
      {
        title: "Share a funny family moment",
        description: "A time when everyone couldn't stop laughing",
        icon: Camera,
        placeholder: "It was hilarious when..."
      }
    ],
    recipe: [
      {
        title: "Grandma's Secret Recipe",
        description: "That special dish everyone asks for",
        placeholder: "Grandma's Famous Chicken Soup"
      },
      {
        title: "Holiday Family Favorite",
        description: "The must-have dish for celebrations",
        placeholder: "Christmas Morning Pancakes"
      },
      {
        title: "Comfort Food Classic",
        description: "The go-to meal that makes everything better",
        placeholder: "Mom's Mac and Cheese"
      }
    ],
    person: [
      {
        title: "Add a Parent",
        description: "Start with mom or dad",
        relation: "Parent"
      },
      {
        title: "Add a Grandparent",
        description: "Honor the family elders",
        relation: "Grandparent"
      },
      {
        title: "Add a Sibling",
        description: "Brothers and sisters",
        relation: "Sibling"
      }
    ]
  }

  const currentPrompts = prompts[type] || []
  const [selectedPrompt, setSelectedPrompt] = useState(0)

  const handleStorySubmit = async () => {
    if (!storyTitle.trim() || !storyContent.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('stories')
        .insert({
          title: storyTitle,
          content: storyContent,
          family_id: familyId,
          profile_id: user.id,
          tags: ['first-story', 'onboarding']
        })

      if (error) throw error

      toast({
        title: "🎉 Your first story is live!",
        description: "Family members will love reading this memory"
      })

      onComplete()
      navigate('/feed')
    } catch (error) {
      console.error('Story creation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecipeSubmit = async () => {
    if (!recipeTitle.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ingredients = recipeIngredients.split('\n').filter(i => i.trim()).map(ingredient => ({
        name: ingredient.trim(),
        amount: '',
        unit: ''
      }))

      const steps = recipeSteps.split('\n').filter(s => s.trim()).map((step, index) => ({
        step: index + 1,
        instruction: step.trim()
      }))

      const { error } = await supabase
        .from('recipes')
        .insert({
          title: recipeTitle,
          ingredients: JSON.stringify(ingredients),
          steps: JSON.stringify(steps),
          family_id: familyId,
          created_by: user.id,
          dietary_tags: ['family-recipe']
        })

      if (error) throw error

      toast({
        title: "👨‍🍳 Recipe added!",
        description: "Your family's culinary treasure is now preserved"
      })

      onComplete()
      navigate('/archive?tab=recipes')
    } catch (error) {
      console.error('Recipe creation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePersonSubmit = async () => {
    if (!personName.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('people')
        .insert({
          full_name: personName,
          given_name: personName.split(' ')[0],
          surname: personName.split(' ').slice(1).join(' '),
          birth_year: personBirthYear ? parseInt(personBirthYear) : null,
          family_id: familyId,
          created_by: user.id,
          notes: `Added during onboarding as ${personRelation}`
        })

      if (error) throw error

      toast({
        title: "🌳 Family member added!",
        description: "Your family tree is starting to grow"
      })

      onComplete()
      navigate('/family-tree')
    } catch (error) {
      console.error('Person creation error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (type === 'story') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Share Your First Memory</span>
          </CardTitle>
          <CardDescription>
            Let's start with a story that captures a special moment
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold mb-3">Choose a prompt to get started:</h3>
              <div className="space-y-3">
                {currentPrompts.map((prompt, index) => {
                  const Icon = prompt.icon
                  return (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPrompt === index ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedPrompt(index)}
                    >
                      <CardContent className="p-4 flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{prompt.title}</h4>
                          <p className="text-sm text-muted-foreground">{prompt.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              <Button onClick={() => setStep(2)} className="w-full">
                Continue with "{currentPrompts[selectedPrompt]?.title}"
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {currentPrompts[selectedPrompt]?.title}
                </Badge>
                <h3 className="font-semibold text-lg">Tell your story</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Give it a title</Label>
                <Input
                  id="title"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="My favorite summer memory"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Share your memory</Label>
                <Textarea
                  id="content"
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  placeholder={currentPrompts[selectedPrompt]?.placeholder}
                  rows={6}
                />
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleStorySubmit} 
                  disabled={loading || !storyTitle.trim() || !storyContent.trim()}
                  className="flex-1"
                >
                  {loading ? 'Publishing...' : 'Share Your Story'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (type === 'recipe') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <span>Add Your First Recipe</span>
          </CardTitle>
          <CardDescription>
            Preserve a beloved family recipe for future generations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipeTitle">Recipe Name</Label>
              <Input
                id="recipeTitle"
                value={recipeTitle}
                onChange={(e) => setRecipeTitle(e.target.value)}
                placeholder="Grandma's Famous Chicken Soup"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients (one per line)</Label>
              <Textarea
                id="ingredients"
                value={recipeIngredients}
                onChange={(e) => setRecipeIngredients(e.target.value)}
                placeholder="2 lbs chicken breast&#10;1 cup carrots, diced&#10;1 cup celery, diced&#10;Salt and pepper to taste"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Instructions (one step per line)</Label>
              <Textarea
                id="steps"
                value={recipeSteps}
                onChange={(e) => setRecipeSteps(e.target.value)}
                placeholder="Season chicken with salt and pepper&#10;Sauté vegetables until tender&#10;Add chicken and cook until golden&#10;Simmer for 30 minutes"
                rows={4}
              />
            </div>

            <Button 
              onClick={handleRecipeSubmit} 
              disabled={loading || !recipeTitle.trim()}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Save Recipe'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'person') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <TreePine className="w-5 h-5 text-green-500" />
            <span>Add Your First Family Member</span>
          </CardTitle>
          <CardDescription>
            Start building your family tree by adding someone special
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personName">Full Name</Label>
              <Input
                id="personName"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Mary Elizabeth Johnson"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personRelation">Relationship to you</Label>
              <Input
                id="personRelation"
                value={personRelation}
                onChange={(e) => setPersonRelation(e.target.value)}
                placeholder="Mother, Father, Grandmother, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthYear">Birth Year (Optional)</Label>
              <Input
                id="birthYear"
                type="number"
                value={personBirthYear}
                onChange={(e) => setPersonBirthYear(e.target.value)}
                placeholder="1952"
              />
            </div>

            <Button 
              onClick={handlePersonSubmit} 
              disabled={loading || !personName.trim()}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add Family Member'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}