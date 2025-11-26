import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				"tss-rounded-xl tss-border tss-bg-card tss-text-card-foreground tss-shadow",
				className
			)}
			{...props}
		/>
	)
);
Card.displayName = "Card";

export { Card };
