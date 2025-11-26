import { Button } from "@/components/ui/button";
import { HelpCircle, Shuffle } from "lucide-react";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import {
	type TimeContext,
	applyRandomMinutes,
	buildTimeContext,
	getTargetTime,
} from "../timeUtils";
import { applyTimeToSelectors, findScheduleModal } from "../twitterSelectors";
import { setApplyingTime } from "../index";
import { HourButtons, type TimePreset } from "./HourButtons";
import { InfoPopup } from "./InfoPopup";
import { TimezonePreview } from "./TimezonePreview";

interface QuickScheduleRootProps {
	modal: HTMLElement;
}

const STORAGE_KEY = "tss_info_dismissed";
const PRESETS_STORAGE_KEY = "tss_custom_presets";

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
];

/**
 * Validate that presets array has correct structure
 */
function validatePresets(data: unknown): data is TimePreset[] {
	if (!Array.isArray(data)) return false;
	return data.every(
		(p) =>
			typeof p === "object" &&
			p !== null &&
			typeof p.id === "string" &&
			typeof p.hours === "number" &&
			p.hours > 0
	);
}

/**
 * Check if extension context is still valid
 */
function isExtensionContextValid(): boolean {
	try {
		return !!(chrome?.storage?.local && chrome?.runtime?.id);
	} catch {
		return false;
	}
}

/**
 * Safe storage set wrapper
 */
function safeStorageSet(data: Record<string, unknown>, callback?: () => void): void {
	if (!isExtensionContextValid()) return;
	try {
		chrome.storage.local.set(data, () => {
			if (chrome.runtime.lastError) {
				console.warn("[Twitter Schedule Shortcuts] Storage set failed:", chrome.runtime.lastError);
				return;
			}
			callback?.();
		});
	} catch {
		// Extension context invalidated
	}
}

/**
 * Safe storage remove wrapper
 */
function safeStorageRemove(key: string): void {
	if (!isExtensionContextValid()) return;
	try {
		chrome.storage.local.remove(key);
	} catch {
		// Extension context invalidated
	}
}

export const QuickScheduleRoot: FC<QuickScheduleRootProps> = ({ modal }) => {
	const [activePresetId, setActivePresetId] = useState<string | null>(null);
	const [timeContext, setTimeContext] = useState<TimeContext | null>(null);
	const [showInfo, setShowInfo] = useState(false);
	const [infoDismissed, setInfoDismissed] = useState(false);
	const [isApplying, setIsApplying] = useState(false);
	const [randomizeMinutes, setRandomizeMinutes] = useState(false);

	// Track if component is mounted to prevent state updates after unmount
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Load settings from storage on mount
	useEffect(() => {
		if (!isExtensionContextValid()) {
			console.warn("[Twitter Schedule Shortcuts] Extension context not available");
			return;
		}

		try {
			chrome.storage.local.get([STORAGE_KEY], (result) => {
				if (chrome.runtime.lastError) {
					console.warn("[Twitter Schedule Shortcuts] Storage read failed:", chrome.runtime.lastError);
					return;
				}

				if (!isMountedRef.current) return;

				try {
					if (result[STORAGE_KEY]) {
						setInfoDismissed(true);
					}
				} catch (error) {
					console.error("[Twitter Schedule Shortcuts] Failed to process storage data:", error);
				}
			});
		} catch {
			// Extension context invalidated
		}
	}, []);

	const handleClickPreset = useCallback(
		async (preset: TimePreset) => {
			if (isApplying) return;

			// Find current modal dynamically to avoid stale closure
			const currentModal = findScheduleModal();
			if (!currentModal) {
				console.warn("[Twitter Schedule Shortcuts] Modal not found");
				return;
			}

			setIsApplying(true);
			setApplyingTime(true); // Prevent MutationObserver from unmounting during DOM changes

			let targetDate = getTargetTime(preset.hours);

			if (randomizeMinutes) {
				targetDate = applyRandomMinutes(targetDate, 5);
			}

			const context = buildTimeContext(preset.hours, targetDate);

			if (isMountedRef.current) {
				setTimeContext(context);
				setActivePresetId(preset.id);
			}

			try {
				await applyTimeToSelectors(currentModal, context.targetDate);
			} catch (error) {
				console.error("[Twitter Schedule Shortcuts] Failed to apply time:", error);
			} finally {
				if (isMountedRef.current) {
					setIsApplying(false);
				}
				setApplyingTime(false); // Re-enable MutationObserver checks
			}
		},
		[isApplying, randomizeMinutes]
	);


	const handleDismissPermanently = useCallback(() => {
		safeStorageSet({ [STORAGE_KEY]: true }, () => {
			if (isMountedRef.current) {
				setInfoDismissed(true);
				setShowInfo(false);
			}
		});
	}, []);

	const handleToggleRandomize = useCallback(() => {
		setRandomizeMinutes((prev) => !prev);
	}, []);

	const handleToggleShowInfo = useCallback(() => {
		setShowInfo((prev) => !prev);
	}, []);

	const handleCloseInfo = useCallback(() => {
		setShowInfo(false);
	}, []);

	return (
		<div className="tss-relative tss-mt-3 tss-mb-2 tss-px-3 tss-py-3 tss-rounded-xl tss-border tss-border-border tss-bg-card">
			{showInfo && (
				<InfoPopup
					onClose={handleCloseInfo}
					onDismissPermanently={!infoDismissed ? handleDismissPermanently : undefined}
				/>
			)}

			<div className="tss-flex tss-items-center tss-justify-between tss-gap-2 tss-mb-3">
				<span className="tss-text-sm tss-font-medium tss-text-foreground">Quick schedule:</span>
				<div className="tss-flex tss-items-center tss-gap-2">
					<Button
						variant={randomizeMinutes ? "default" : "secondary"}
						size="sm"
						onClick={handleToggleRandomize}
						title="Randomize minutes +/- 5"
					>
						<Shuffle />
						+/-5m
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleToggleShowInfo}
					>
						<HelpCircle />
						What is this?
					</Button>
				</div>
			</div>

			<HourButtons
				activePresetId={activePresetId}
				presets={DEFAULT_PRESETS}
				onClickPreset={handleClickPreset}
				disabled={isApplying}
			/>

			<TimezonePreview context={timeContext} />
		</div>
	);
};
