// Example prompts that rotate in the first login experience
export const examplePrompts = [
  {
    id: 'example-1',
    text: 'Advice I actually used at work.',
    category: 'career'
  },
  {
    id: 'example-2',
    text: 'A sentence that changed my parenting.',
    category: 'family'
  },
  {
    id: 'example-3',
    text: 'Something an elder told me that still helps.',
    category: 'wisdom'
  }
]

export function getRandomExamplePrompt() {
  return examplePrompts[Math.floor(Math.random() * examplePrompts.length)]
}
