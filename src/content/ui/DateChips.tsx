import { Button } from "@/components/ui/button"
import { type FC, memo, useMemo } from "react"

export interface DateOption {
	id: string
	date: Date
	label: string
	daysFromNow: number
}

interface DateChipsProps {
	selectedDateId: string | null
	onSelectDate: (dateOption: DateOption) => void
	disabled?: boolean
}

/**
 * Generate date options for the next N days
 */
function generateDateOptions(days: number): DateOption[] {
	const options: DateOption[] = []
	const now = new Date()

	for (let i = 0; i <= days; i++) {
		const date = new Date(now)
		date.setDate(date.getDate() + i)
		// Reset to start of day for consistency
		date.setHours(0, 0, 0, 0)

		let label: string
		if (i === 0) {
			label = "Today"
		} else if (i === 1) {
			label = "Tomorrow"
		} else {
			// Format as "Mon 2" or "Tue 3"
			label = new Intl.DateTimeFormat("en-US", {
				weekday: "short",
				day: "numeric",
			}).format(date)
		}

		options.push({
			id: `day-${i}`,
			date,
			label,
			daysFromNow: i,
		})
	}

	return options
}

const DateChipsComponent: FC<DateChipsProps> = ({ selectedDateId, onSelectDate, disabled }) => {
	const dateOptions = useMemo(() => generateDateOptions(14), [])

	return (
		<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
			{dateOptions.map(option => (
				<Button
					key={option.id}
					variant={selectedDateId === option.id ? "default" : "outline"}
					size="sm"
					onClick={() => onSelectDate(option)}
					disabled={disabled}
					className="flex-shrink-0 whitespace-nowrap"
				>
					{option.label}
				</Button>
			))}
		</div>
	)
}

export const DateChips = memo(DateChipsComponent)
DateChips.displayName = "DateChips"
