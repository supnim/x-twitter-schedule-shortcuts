import { Button } from "@/components/ui/button";
import { type FC, memo, useMemo } from "react";
import { formatTimeShort, getTargetTime } from "../timeUtils";

export interface TimePreset {
	id: string;
	hours: number;
}

interface HourButtonsProps {
	activePresetId: string | null;
	presets: TimePreset[];
	onClickPreset: (preset: TimePreset) => void;
	disabled?: boolean;
}

const HourButtonsComponent: FC<HourButtonsProps> = ({
	activePresetId,
	presets,
	onClickPreset,
	disabled,
}) => {
	// Memoize preset labels calculation
	const presetLabels = useMemo(() => {
		return presets.map((preset) => {
			const targetTime = getTargetTime(preset.hours);
			const timeStr = formatTimeShort(targetTime);
			return `${timeStr} (+${preset.hours}hr)`;
		});
	}, [presets]);

	return (
		<div className="tss-grid tss-grid-cols-3 tss-gap-2">
			{presets.map((preset, index) => (
				<Button
					key={preset.id}
					variant={activePresetId === preset.id ? "default" : "outline"}
					onClick={() => onClickPreset(preset)}
					disabled={disabled}
					// size="sm"
				>
					{presetLabels[index]}
				</Button>
			))}
		</div>
	);
};

export const HourButtons = memo(HourButtonsComponent);
HourButtons.displayName = "HourButtons";
