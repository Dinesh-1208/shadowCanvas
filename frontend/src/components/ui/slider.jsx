import * as React from "react"
import { cn } from "../../lib/utils"

// Simplified slider since Radix Slider is heavy to install separately without instructions.
// Using native range input styled to look like Shadcn
const Slider = React.forwardRef(({ className, ...props }, ref) => (
    <input
        type="range"
        className={cn(
            "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
            className
        )}
        ref={ref}
        {...props}
    />
))
Slider.displayName = "Slider"

export { Slider }
