import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface PageSkeletonProps {
  variant?: "default" | "cards" | "table" | "kanban" | "form";
  title?: boolean;
  description?: boolean;
  metrics?: number;
  rows?: number;
  columns?: number;
}

export function PageSkeleton({
  variant = "default",
  title = true,
  description = true,
  metrics = 4,
  rows = 5,
  columns = 4,
}: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && <Skeleton className="h-9 w-48" />}
          {description && <Skeleton className="h-5 w-96 max-w-full" />}
        </div>
      )}

      {/* Metrics Cards */}
      {metrics > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: metrics }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Content based on variant */}
      {variant === "cards" && <CardGridSkeleton count={6} />}
      {variant === "table" && <TableSkeleton rows={rows} columns={columns} />}
      {variant === "kanban" && <KanbanSkeleton columns={5} />}
      {variant === "form" && <FormSkeleton fields={6} />}
      {variant === "default" && <CardGridSkeleton count={4} />}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </Card>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-4 text-left">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border last:border-0">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="p-4">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function KanbanSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, colIdx) => (
        <div key={colIdx} className="flex-shrink-0 w-72">
          <div className="p-3 bg-muted/50 rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, cardIdx) => (
              <Card key={cardIdx} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </Card>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
