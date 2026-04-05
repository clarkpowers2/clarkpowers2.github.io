import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Store } from '@/lib/types'

interface CreateStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (store: { name: string; location: string }) => void
}

export function CreateStoreDialog({ open, onOpenChange, onCreate }: CreateStoreDialogProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !location) {
      return
    }
    
    onCreate({ name, location })
    
    setName('')
    setLocation('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Store</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name" className="text-sm font-medium">Store Name</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Downtown Market"
              className="h-12"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 123 Main St"
              className="h-12"
              required
            />
          </div>
          
          <Button type="submit" size="lg" className="w-full mt-6">
            Create Store
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
