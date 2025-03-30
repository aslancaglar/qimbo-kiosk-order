
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    enableScrollArea?: boolean,
    showFooter?: boolean,
    footer?: React.ReactNode
  }
>(({ className, align = "center", sideOffset = 4, enableScrollArea = false, showFooter = false, footer, children, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        showFooter ? "max-h-[70vh] flex flex-col" : "max-h-[70vh] p-4",
        className
      )}
      {...props}
    >
      {showFooter ? (
        <>
          <div className="p-4 flex-1 overflow-hidden">
            {enableScrollArea ? (
              <ScrollArea className="h-full pr-2">
                <div className="pr-2">
                  {children}
                </div>
              </ScrollArea>
            ) : (
              children
            )}
          </div>
          <div className="border-t p-3 bg-muted/20 mt-auto">
            {footer}
          </div>
        </>
      ) : (
        enableScrollArea ? (
          <ScrollArea className="max-h-[calc(70vh-40px)] w-full pr-2 overflow-auto">
            <div className="pr-2">
              {children}
            </div>
          </ScrollArea>
        ) : (
          children
        )
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
