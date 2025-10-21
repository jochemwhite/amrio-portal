import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Schema Not Found</h2>
      <p className="text-muted-foreground">
        The schema you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <Button asChild>
        <Link href="/dashboard/admin/schemas">Back to Schemas</Link>
      </Button>
    </div>
  )
}

