import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { type FC, memo } from "react"

interface InfoPopupProps {
	onClose: () => void
}

const InfoPopupComponent: FC<InfoPopupProps> = ({ onClose }) => {
	return (
		<Card className="absolute top-0 left-0 right-0 z-10 p-4 shadow-lg bg-popover border-border">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1">
					<p className="text-sm text-foreground mb-3">
						This is a shortcut for quickly setting the date/time. It is added by the{" "}
						<strong>Twitter Schedule Shortcuts</strong> extension.
					</p>
					<p className="text-sm text-muted-foreground mb-3">
						Made by{" "}
						<a
							href="https://x.com/sup_nim"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							@sup_nim
						</a>
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 shrink-0"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</Card>
	)
}

export const InfoPopup = memo(InfoPopupComponent)
InfoPopup.displayName = "InfoPopup"
