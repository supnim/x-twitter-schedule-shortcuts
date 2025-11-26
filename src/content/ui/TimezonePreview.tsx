import { type FC, memo } from "react"
import type { TimeContext } from "../timeUtils"
import { getTimezoneFriendlyName } from "../timeUtils"

interface TimezonePreviewProps {
	context: TimeContext | null
}

const TimezonePreviewComponent: FC<TimezonePreviewProps> = ({ context }) => {
	if (!context) {
		return null
	}

	const { local, us, uk } = context

	return (
		<div className="mt-2 text-xs text-muted-foreground space-y-0.5">
			<div>
				<span className="font-medium">Local:</span> {local.formatted} ({local.abbreviation})
			</div>
			<div>
				<span className="font-medium">{getTimezoneFriendlyName(us.timezone)}:</span> {us.formatted}
			</div>
			<div>
				<span className="font-medium">{getTimezoneFriendlyName(uk.timezone)}:</span> {uk.formatted}
			</div>
		</div>
	)
}

export const TimezonePreview = memo(TimezonePreviewComponent)
TimezonePreview.displayName = "TimezonePreview"
