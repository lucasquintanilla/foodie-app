import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonProductItem() {
  return (
    <div className="overflow-hidden bg-muted rounded-lg shadow-sm">
      <Skeleton className="h-[200px] w-full bg-gray-200" />
      <div className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px] bg-gray-200" />
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-6 w-[80px] bg-gray-200" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
            <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
            <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

