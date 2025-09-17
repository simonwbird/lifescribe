export interface TreeVersion {
  id: string
  name: string
  createdAt: string
  layout: {
    nodes: Array<{ personId: string; x: number; y: number; depth: number }>
    meta: { hGap: number; vGap: number; zoom: number; pan: { x: number; y: number } }
  }
}

export class VersionService {
  private familyId: string
  private storageKey: string
  
  constructor(familyId: string) {
    this.familyId = familyId
    this.storageKey = `family-tree-versions-${familyId}`
  }
  
  public async list(): Promise<TreeVersion[]> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load tree versions:', error)
      return []
    }
  }
  
  public async save(
    name: string,
    nodes: Array<{ personId: string; x: number; y: number; depth: number }>,
    meta: { hGap: number; vGap: number; zoom: number; pan: { x: number; y: number } }
  ): Promise<TreeVersion> {
    try {
      const versions = await this.list()
      
      const newVersion: TreeVersion = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        layout: { nodes, meta }
      }
      
      versions.push(newVersion)
      localStorage.setItem(this.storageKey, JSON.stringify(versions))
      
      return newVersion
    } catch (error) {
      console.error('Failed to save tree version:', error)
      throw new Error('Failed to save tree version')
    }
  }
  
  public async load(id: string): Promise<TreeVersion | null> {
    try {
      const versions = await this.list()
      return versions.find(v => v.id === id) || null
    } catch (error) {
      console.error('Failed to load tree version:', error)
      return null
    }
  }
  
  public async delete(id: string): Promise<void> {
    try {
      const versions = await this.list()
      const filtered = versions.filter(v => v.id !== id)
      localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to delete tree version:', error)
      throw new Error('Failed to delete tree version')
    }
  }
  
  public async rename(id: string, name: string): Promise<void> {
    try {
      const versions = await this.list()
      const version = versions.find(v => v.id === id)
      if (version) {
        version.name = name
        localStorage.setItem(this.storageKey, JSON.stringify(versions))
      }
    } catch (error) {
      console.error('Failed to rename tree version:', error)
      throw new Error('Failed to rename tree version')
    }
  }
}