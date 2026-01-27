import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"
import { Button, buttonVariants } from "./button"

const SidebarContext = React.createContext<{
  variant?: "default" | "floating"
}>({})

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    variant?: "default" | "floating"
  }
>(({ className, variant = "default", children, ...props }, ref) => {
  return (
    <SidebarContext.Provider value={{ variant }}>
      <div ref={ref} className={cn("flex", className)} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

const sidebarVariants = cva(
  "flex flex-col h-full border-r bg-background",
  {
    variants: {
      variant: {
        default: "",
        floating: "rounded-lg border shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    VariantProps<typeof sidebarVariants>
>(({ className, variant, ...props }, ref) => {
  const context = React.useContext(SidebarContext)
  const finalVariant = variant || context.variant || "default"

  return (
    <aside
      ref={ref}
      className={cn(sidebarVariants({ variant: finalVariant }), className)}
      {...props}
    />
  )
})
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto p-4", className)}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-2 mb-6 last:mb-0", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn("space-y-1", className)}
      {...props}
    />
  )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => {
  return (
    <li
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "w-full justify-start gap-2",
  {
    variants: {
      variant: {
        default: "",
        ghost: "",
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof sidebarMenuButtonVariants> & {
      asChild?: boolean
      isActive?: boolean
    }
>(({ className, variant = "ghost", asChild = false, isActive, ...props }, ref) => {
  const Comp = asChild ? Slot : Button

  return (
    <Comp
      ref={ref}
      variant={variant}
      className={cn(
        sidebarMenuButtonVariants({ variant }),
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
}
