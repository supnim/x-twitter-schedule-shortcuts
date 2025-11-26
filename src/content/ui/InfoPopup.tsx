import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coffee, X } from "lucide-react";
import { type FC, memo } from "react";

interface InfoPopupProps {
	onClose: () => void;
	onDismissPermanently?: () => void;
}

const InfoPopupComponent: FC<InfoPopupProps> = ({ onClose, onDismissPermanently }) => {
	return (
		<Card className="tss-absolute tss-top-0 tss-left-0 tss-right-0 tss-z-10 tss-p-4 tss-shadow-lg tss-bg-popover tss-border-border">
			<div className="tss-flex tss-items-start tss-justify-between tss-gap-2">
				<div className="tss-flex-1">
					<p className="tss-text-sm tss-text-foreground tss-mb-3">
						This is a shortcut for quickly setting the date/time. It is added by the{" "}
						<strong>Twitter Schedule Shortcuts</strong> extension.
					</p>
					<p className="tss-text-sm tss-text-muted-foreground tss-mb-3">
						Made by{" "}
						<a
							href="https://x.com/sup_nim"
							target="_blank"
							rel="noopener noreferrer"
							className="tss-text-primary hover:tss-underline"
						>
							@sup_nim
						</a>
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="tss-h-6 tss-w-6 tss-shrink-0"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="tss-h-4 tss-w-4" />
				</Button>
			</div>

			<div className="tss-flex tss-items-center tss-justify-between tss-pt-3 tss-border-t tss-border-border">
				<a
					href="https://buymeacoffee.com/sup_nim"
					target="_blank"
					rel="noopener noreferrer"
					className="tss-inline-flex tss-items-center tss-gap-1.5 tss-text-sm tss-text-muted-foreground hover:tss-text-foreground tss-transition-colors"
				>
					<Coffee className="tss-h-4 tss-w-4" />
					<span>Buy me a coffee</span>
				</a>

				<div className="tss-flex tss-items-center tss-gap-2">
					{onDismissPermanently && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onDismissPermanently}
							className="tss-text-xs"
						>
							Don't show again
						</Button>
					)}
					<Button variant="outline" size="sm" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</Card>
	);
};

export const InfoPopup = memo(InfoPopupComponent);
InfoPopup.displayName = "InfoPopup";
