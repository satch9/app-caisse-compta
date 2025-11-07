import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
  xl: "w-12 h-12 border-4"
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses[size],
        className
      )}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Chargement...
      </span>
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  className?: string
}

export function LoadingOverlay({ message = "Chargement...", className }: LoadingOverlayProps) {
  return (
    <div className={cn("fixed inset-0 z-50 bg-black/50 flex items-center justify-center", className)}>
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-lg font-semibold">{message}</p>
      </div>
    </div>
  )
}
