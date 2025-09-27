'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Pencil, Loader2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Job } from '@coloringpage/types'

interface EditHistory {
  edit_count: number
  edits_remaining: number
}

interface EditInterfaceProps {
  job: Job
  onEditJobCreated: (editJob: Job) => void
}

export function EditInterface({ job, onEditJobCreated }: EditInterfaceProps) {
  const [editPrompt, setEditPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editHistory, setEditHistory] = useState<EditHistory>({ edit_count: 0, edits_remaining: 2 })
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Load edit history for this job
  useEffect(() => {
    const loadEditHistory = async () => {
      try {
        // We could create an API endpoint to get edit count, but for now let's assume 0/2
        // In a real implementation, we'd call something like:
        // const response = await fetch(`/api/jobs/${job.id}/edit-history`)
        // For now, we'll start with 0 edits used
        setEditHistory({ edit_count: 0, edits_remaining: 2 })
      } catch (error) {
        console.error('Failed to load edit history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadEditHistory()
  }, [job.id])

  const handleSubmitEdit = async () => {
    if (!editPrompt.trim()) {
      toast({
        title: 'Edit prompt required',
        description: 'Please describe what you want to change about the coloring page.',
        variant: 'destructive'
      })
      return
    }

    if (editPrompt.length < 3) {
      toast({
        title: 'Edit prompt too short',
        description: 'Please provide at least 3 characters describing your edit.',
        variant: 'destructive'
      })
      return
    }

    if (editHistory.edits_remaining <= 0) {
      toast({
        title: 'Edit limit reached',
        description: 'You have used all 2 edits for this coloring page.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/jobs/${job.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          editPrompt: editPrompt.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create edit job')
      }

      const editJob = await response.json()

      // Update edit history
      setEditHistory(prev => ({
        edit_count: prev.edit_count + 1,
        edits_remaining: prev.edits_remaining - 1
      }))

      // Clear the edit prompt
      setEditPrompt('')

      // Notify parent component about the new edit job
      console.log('📝 EDIT SUBMISSION SUCCESS:')
      console.log('  Original job ID:', job.id)
      console.log('  Edit prompt:', editPrompt.trim())
      console.log('  Created edit job ID:', editJob.id)
      console.log('  Edit job status:', editJob.status)
      console.log('  Edit job params:', editJob.params_json)
      console.log('  Calling onEditJobCreated callback...')

      onEditJobCreated(editJob)

      console.log('  ✅ Edit job callback completed, showing toast')

      toast({
        title: 'Edit started',
        description: 'Your coloring page is being modified. This may take a few moments.',
        duration: 15000 // Longer duration to cover processing time
      })

    } catch (error) {
      console.error('Edit submission error:', error)
      toast({
        title: 'Edit failed',
        description: error instanceof Error ? error.message : 'Please try again or contact support.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditDisabled = editHistory.edits_remaining <= 0 || isSubmitting

  const getEditPromptPlaceholder = () => {
    const examples = [
      'Add stars in the background',
      'Make the lines thicker',
      'Add flowers around the character',
      'Remove small details',
      'Add a rainbow in the sky',
      'Make it simpler for younger kids'
    ]
    return examples[Math.floor(Math.random() * examples.length)]
  }

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading edit options...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="edit-interface">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-brand-warm-orange" />
          <h4 className="font-medium">Edit This Page</h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={editHistory.edits_remaining > 0 ? "secondary" : "outline"}
            className={editHistory.edits_remaining > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
          >
            {editHistory.edits_remaining} edits remaining
          </Badge>
        </div>
      </div>

      {/* Edit Status Alert */}
      {editHistory.edits_remaining <= 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have used all available edits for this coloring page. Create a new page to get fresh edit credits.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Describe what you'd like to change and we'll create an improved version. Each edit uses 1 credit.
          </AlertDescription>
        </Alert>
      )}

      {/* Edit Form */}
      {editHistory.edits_remaining > 0 && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-prompt" className="text-sm font-medium">
              What would you like to change?
            </Label>
            <Textarea
              id="edit-prompt"
              placeholder={getEditPromptPlaceholder()}
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 min-h-[80px]"
              maxLength={200}
              data-testid="edit-prompt-input"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-600">
                Be specific: "add stars", "make lines thicker", "remove background details"
              </p>
              <span className="text-xs text-gray-500">
                {editPrompt.length}/200
              </span>
            </div>
          </div>

          <Button
            onClick={handleSubmitEdit}
            disabled={isEditDisabled || !editPrompt.trim()}
            className="w-full bg-brand-warm-orange hover:bg-brand-warm-orange/90 text-white"
            data-testid="submit-edit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Edit...
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Coloring Page (1 credit)
              </>
            )}
          </Button>
        </div>
      )}

      {/* Edit History */}
      {editHistory.edit_count > 0 && (
        <div className="text-sm text-gray-600">
          <Clock className="inline h-3 w-3 mr-1" />
          You have used {editHistory.edit_count} of 2 edits on this page
        </div>
      )}
    </div>
  )
}