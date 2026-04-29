import { Skeleton } from '@/components/ui/skeleton'

export default function GlobalLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Skeleton className="mb-6 h-10 w-64" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border">
            <Skeleton className="h-44 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
