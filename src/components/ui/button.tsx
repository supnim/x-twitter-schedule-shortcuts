import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"tss-inline-flex tss-items-center tss-justify-center tss-gap-2 tss-whitespace-nowrap tss-rounded-md tss-text-sm tss-font-medium tss-transition-colors focus-visible:tss-outline-none focus-visible:tss-ring-1 focus-visible:tss-ring-ring disabled:tss-pointer-events-none disabled:tss-opacity-50 [&_svg]:tss-size-4 [&_svg]:tss-shrink-0",
	{
		variants: {
			variant: {
				default: "tss-bg-primary tss-text-primary-foreground tss-shadow hover:tss-bg-primary/90",
				destructive:
					"tss-bg-destructive tss-text-destructive-foreground tss-shadow-sm hover:tss-bg-destructive/90",
				outline:
					"tss-border tss-border-input tss-bg-background tss-shadow-sm hover:tss-bg-accent hover:tss-text-accent-foreground",
				secondary:
					"tss-bg-secondary tss-text-secondary-foreground tss-shadow-sm hover:tss-bg-secondary/80",
				ghost: "hover:tss-bg-accent hover:tss-text-accent-foreground",
				link: "tss-text-primary tss-underline-offset-4 hover:tss-underline",
			},
			size: {
				default: "tss-h-9 tss-px-4 tss-py-2",
				sm: "tss-h-8 tss-rounded-md tss-px-3 tss-text-xs",
				xs: "tss-h-6 tss-rounded-md tss-px-2 tss-text-xs",
				lg: "tss-h-10 tss-rounded-md tss-px-8",
				icon: "tss-h-9 tss-w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				type={asChild ? undefined : type}
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	}
);
Button.displayName = "Button";

export { Button, buttonVariants };
