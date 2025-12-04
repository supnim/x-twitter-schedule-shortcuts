import { Button } from "@/components/ui/button"
import { HelpCircle, Shuffle } from "lucide-react"
import { type FC, useCallback, useEffect, useRef, useState } from "react"
import { setApplyingTime } from "../index"
import { type TimeContext, applyRandomMinutes, buildTimeContext } from "../timeUtils"
import { applyDateToSelectors, applyTimeToSelectors, findScheduleModal } from "../twitterSelectors"
import { DateChips, type DateOption } from "./DateChips"
import { HourButtons, type TimePreset } from "./HourButtons"
import { InfoPopup } from "./InfoPopup"
import { TimezonePreview } from "./TimezonePreview"

interface QuickScheduleRootProps {
	modal: HTMLElement
}

const STORAGE_KEY = "tss_info_dismissed"

const DEFAULT_PRESETS: TimePreset[] = [
	{ id: "1h", hours: 1 },
	{ id: "2h", hours: 2 },
	{ id: "3h", hours: 3 },
	{ id: "4h", hours: 4 },
	{ id: "5h", hours: 5 },
	{ id: "6h", hours: 6 },
	{ id: "7h", hours: 7 },
	{ id: "8h", hours: 8 },
	{ id: "9h", hours: 9 },
	{ id: "10h", hours: 10 },
	{ id: "11h", hours: 11 },
	{ id: "12h", hours: 12 },
]

/**
 * Check if extension context is still valid
 */
function isExtensionContextValid(): boolean {
	try {
		return !!(chrome?.storage?.local && chrome?.runtime?.id)
	} catch {
		return false
	}
}

export const QuickScheduleRoot: FC<QuickScheduleRootProps> = () => {
	const [selectedDate, setSelectedDate] = useState<DateOption | null>(null)
	const [activePresetId, setActivePresetId] = useState<string | null>(null)
	const [timeContext, setTimeContext] = useState<TimeContext | null>(null)
	const [showInfo, setShowInfo] = useState(false)
	const [_infoDismissed, setInfoDismissed] = useState(false)
	const [isApplying, setIsApplying] = useState(false)
	const [randomizeMinutes, setRandomizeMinutes] = useState(false)

	// Track if component is mounted to prevent state updates after unmount
	const isMountedRef = useRef(true)

	useEffect(() => {
		isMountedRef.current = true
		return () => {
			isMountedRef.current = false
		}
	}, [])

	// Load settings from storage on mount
	useEffect(() => {
		if (!isExtensionContextValid()) {
			console.warn("[Twitter Schedule Shortcuts] Extension context not available")
			return
		}

		try {
			chrome.storage.local.get([STORAGE_KEY], result => {
				if (chrome.runtime.lastError) {
					console.warn(
						"[Twitter Schedule Shortcuts] Storage read failed:",
						chrome.runtime.lastError
					)
					return
				}

				if (!isMountedRef.current) return

				try {
					if (result[STORAGE_KEY]) {
						setInfoDismissed(true)
					}
				} catch (error) {
					console.error("[Twitter Schedule Shortcuts] Failed to process storage data:", error)
				}
			})
		} catch {
			// Extension context invalidated
		}
	}, [])

	const handleSelectDate = useCallback(
		async (dateOption: DateOption) => {
			if (isApplying) return

			// Find current modal dynamically
			const currentModal = findScheduleModal()
			if (!currentModal) {
				console.warn("[Twitter Schedule Shortcuts] Modal not found")
				return
			}

			setIsApplying(true)
			setApplyingTime(true)

			setSelectedDate(dateOption)
			// Clear the hour selection and time context when date changes
			setActivePresetId(null)
			setTimeContext(null)

			try {
				// Apply date to Twitter's dropdowns immediately
				await applyDateToSelectors(currentModal, dateOption.date)
			} catch (error) {
				console.error("[Twitter Schedule Shortcuts] Failed to apply date:", error)
			} finally {
				if (isMountedRef.current) {
					setIsApplying(false)
				}
				setApplyingTime(false)
			}
		},
		[isApplying]
	)

	const handleClickPreset = useCallback(
		async (preset: TimePreset) => {
			if (isApplying) return

			// Find current modal dynamically to avoid stale closure
			const currentModal = findScheduleModal()
			if (!currentModal) {
				console.warn("[Twitter Schedule Shortcuts] Modal not found")
				return
			}

			setIsApplying(true)
			setApplyingTime(true) // Prevent MutationObserver from unmounting during DOM changes

			// Calculate target date based on selected date + hours
			let targetDate: Date
			if (selectedDate) {
				// Use selected date as base, add hours from now's time
				const now = new Date()
				targetDate = new Date(selectedDate.date)
				// Set the time to current time + hours
				targetDate.setHours(now.getHours() + preset.hours)
				targetDate.setMinutes(now.getMinutes())
				targetDate.setSeconds(0)
				targetDate.setMilliseconds(0)
			} else {
				// No date selected, use today and add hours from now
				targetDate = new Date()
				targetDate.setHours(targetDate.getHours() + preset.hours)
			}

			if (randomizeMinutes) {
				targetDate = applyRandomMinutes(targetDate, 5)
			}

			const context = buildTimeContext(preset.hours, targetDate)

			if (isMountedRef.current) {
				setTimeContext(context)
				setActivePresetId(preset.id)
			}

			try {
				await applyTimeToSelectors(currentModal, context.targetDate)
			} catch (error) {
				console.error("[Twitter Schedule Shortcuts] Failed to apply time:", error)
			} finally {
				if (isMountedRef.current) {
					setIsApplying(false)
				}
				setApplyingTime(false) // Re-enable MutationObserver checks
			}
		},
		[isApplying, randomizeMinutes, selectedDate]
	)

	const handleToggleRandomize = useCallback(() => {
		setRandomizeMinutes(prev => !prev)
	}, [])

	const handleToggleShowInfo = useCallback(() => {
		setShowInfo(prev => !prev)
	}, [])

	const handleCloseInfo = useCallback(() => {
		setShowInfo(false)
	}, [])

	return (
		<div className="relative mt-3 mb-2 ">
			{showInfo && <InfoPopup onClose={handleCloseInfo} />}

			<div className="flex items-center justify-between gap-2 mb-3">
				<span className="text-sm font-medium text-muted-foreground">Quick schedule:</span>
				<div className="flex items-center gap-2">
					<Button
						variant={randomizeMinutes ? "default" : "ghost"}
						size="sm"
						className="text-sm"
						onClick={handleToggleRandomize}
						title="Randomize minutes +/- 5"
					>
						<Shuffle />
						+/-5m
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="text-muted-foreground text-xs"
						onClick={handleToggleShowInfo}
					>
						<HelpCircle />
						What is this?
					</Button>
				</div>
			</div>

			<div className="mb-3">
				<span className="text-xs text-muted-foreground mb-1.5 block">Date:</span>
				<DateChips
					selectedDateId={selectedDate?.id ?? null}
					onSelectDate={handleSelectDate}
					disabled={isApplying}
				/>
			</div>

			<div>
				<span className="text-xs text-muted-foreground mb-1.5 block">Time (+hours from now):</span>
				<HourButtons
					activePresetId={activePresetId}
					presets={DEFAULT_PRESETS}
					onClickPreset={handleClickPreset}
					disabled={isApplying}
				/>
			</div>

			<TimezonePreview context={timeContext} />
		</div>
	)
}
