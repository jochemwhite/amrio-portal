'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SchemaFormDialog } from './SchemaFormDialog'
import { useRouter } from 'next/navigation'

export function CreateSchemaButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = () => {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Schema
      </Button>
      <SchemaFormDialog open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
    </>
  )
}

