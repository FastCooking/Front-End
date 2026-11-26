import { Card, Skeleton } from "../../../components/ui";

export default function OrderTrackingSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="space-y-2 text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-7 w-60 mx-auto" />
        </div>

        <Card>
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center justify-between gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center flex-1 gap-2">
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <Skeleton className="h-3 w-28" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </Card>
      </div>
    </div>
  );
}
