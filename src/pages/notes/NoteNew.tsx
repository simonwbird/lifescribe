import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Header from '@/components/Header'

export default function NoteNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; text: string; checked: boolean }>>([])
  const [newItem, setNewItem] = useState('')

  const addChecklistItem = () => {
    if (newItem.trim()) {
      setChecklistItems([
        ...checklistItems,
        { id: Date.now().toString(), text: newItem, checked: false },
      ])
      setNewItem('')
    }
  }

  const toggleItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const removeItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">New Note</h1>
          <p className="text-muted-foreground">
            Create a quick note or checklist
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                placeholder="Note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="note" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="note">Note</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
              </TabsList>

              <TabsContent value="note" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="note-content">Content</Label>
                  <textarea
                    id="note-content"
                    className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Write your note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <span className={item.checked ? 'line-through text-muted-foreground flex-1' : 'flex-1'}>
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add new item..."
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addChecklistItem()
                      }
                    }}
                  />
                  <Button onClick={addChecklistItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button onClick={() => {}}>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
