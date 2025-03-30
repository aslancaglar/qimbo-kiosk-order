
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
    contentClassName?: string,
    footerClassName?: string
  }
>(({ className, align = "center", sideOffset = 4, enableScrollArea = false, contentClassName, footerClassName, children, ...props }, ref) => {
  // Separate children into content and footer
  const contentChildren: React.ReactNode[] = [];
  const footerChildren: React.ReactNode[] = [];
  
  React.Children.forEach(children, child => {
    if (React.isValidElement(child) && child.props.className?.includes('popover-footer')) {
      footerChildren.push(child);
    } else {
      contentChildren.push(child);
    }
  });
  
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-h-[70vh] flex flex-col",
          className
        )}
        {...props}
      >
        <div className={cn("flex-grow overflow-hidden p-4", contentClassName)}>
          {enableScrollArea ? (
            <ScrollArea className="h-full max-h-[calc(70vh-60px)]">
              {contentChildren}
            </ScrollArea>
          ) : (
            contentChildren
          )}
        </div>
        
        {footerChildren.length > 0 && (
          <div className={cn("mt-auto p-4 pt-2 border-t", footerClassName)}>
            {footerChildren}
          </div>
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
