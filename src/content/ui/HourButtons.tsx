import { Button } from "@/components/ui/button"
import { type FC, memo, useMemo } from "react"
import { formatTimeShort, getTargetTime } from "../timeUtils"

export interface TimePreset {
	id: string
	hours: number
}

interface HourButtonsProps {
	activePresetId: string | null
	presets: TimePreset[]
	onClickPreset: (preset: TimePreset) => void
	disabled?: boolean
}

const HourButtonsComponent: FC<HourButtonsProps> = ({
	activePresetId,
	presets,
	onClickPreset,
	disabled,
}) => {
	// Memoize preset labels calculation
	const presetLabels = useMemo(() => {
		return presets.map(preset => {
			const targetTime = getTargetTime(preset.hours)
			const timeStr = formatTimeShort(targetTime)
			return `${timeStr}`
		})
	}, [presets])

	return (
		<div className="grid grid-cols-3 gap-2">
			{presets.map((preset, index) => (
				<Button
					key={preset.id}
					variant={activePresetId === preset.id ? "default" : "outline"}
					onClick={() => onClickPreset(preset)}
					disabled={disabled}
				>
					{presetLabels[index]}
					<span className="ml-2 text-muted-foreground"> / +{preset.hours}hr</span>
				</Button>
			))}
		</div>
	)
}

export const HourButtons = memo(HourButtonsComponent)
HourButtons.displayName = "HourButtons"
