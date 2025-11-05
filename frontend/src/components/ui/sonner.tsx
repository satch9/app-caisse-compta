import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-2 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-5 group-[.toaster]:min-w-[320px] group-[.toaster]:text-base group-[.toaster]:font-semibold",
          description: "group-[.toast]:text-gray-600 group-[.toast]:text-sm group-[.toast]:font-normal group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-bold group-[.toast]:px-4 group-[.toast]:py-2",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toast]:bg-red-500 group-[.toast]:text-white group-[.toast]:border-red-600 group-[.toast]:shadow-red-200",
          success: "group-[.toast]:bg-green-500 group-[.toast]:text-white group-[.toast]:border-green-600 group-[.toast]:shadow-green-200",
          warning: "group-[.toast]:bg-yellow-500 group-[.toast]:text-white group-[.toast]:border-yellow-600 group-[.toast]:shadow-yellow-200",
          info: "group-[.toast]:bg-blue-500 group-[.toast]:text-white group-[.toast]:border-blue-600 group-[.toast]:shadow-blue-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
