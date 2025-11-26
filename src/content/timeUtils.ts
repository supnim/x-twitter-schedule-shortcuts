/**
 * Time calculation and timezone formatting utilities
 */

export const TIMEZONES = {
	US: "America/New_York",
	UK: "Europe/London",
} as const

/**
 * Calculate a target date N hours from now
 */
export function getTargetTime(hoursFromNow: number): Date {
	let validHours = hoursFromNow
	if (!Number.isFinite(hoursFromNow) || hoursFromNow <= 0) {
		console.warn("[timeUtils] Invalid hoursFromNow, defaulting to 1 hour")
		validHours = 1
	}
	const now = new Date()
	return new Date(now.getTime() + validHours * 60 * 60 * 1000)
}

/**
 * Get the user's local timezone identifier
 */
export function getLocalTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Get a short timezone abbreviation for display
 */
export function getTimezoneAbbreviation(timeZone: string, date: Date | null | undefined): string {
	if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
		return timeZone
	}
	try {
		// Use formatToParts to extract the timezone name
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone,
			timeZoneName: "short",
		})

		const parts = formatter.formatToParts(date)
		const tzPart = parts.find(part => part.type === "timeZoneName")
		return tzPart?.value || timeZone
	} catch {
		return timeZone
	}
}

/**
 * Format a date for a specific timezone
 * Returns format like "Tue 25 Nov, 17:51"
 */
export function formatForTimezone(date: Date | null | undefined, timeZone: string): string {
	if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
		return "Invalid date"
	}
	try {
		return new Intl.DateTimeFormat("en-GB", {
			weekday: "short",
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone,
		}).format(date)
	} catch {
		// Fallback if timezone is invalid
		return date.toLocaleString()
	}
}

export interface TimeContext {
	targetDate: Date
	hoursFromNow: number
	local: {
		formatted: string
		timezone: string
		abbreviation: string
	}
	us: {
		formatted: string
		timezone: string
		abbreviation: string
	}
	uk: {
		formatted: string
		timezone: string
		abbreviation: string
	}
}

/**
 * Build a complete time context for display
 * @param hoursFromNow - Number of hours from now
 * @param targetDate - Optional pre-calculated target date (used when randomization is applied)
 */
export function buildTimeContext(hoursFromNow: number, targetDate?: Date): TimeContext {
	const finalTargetDate = targetDate || getTargetTime(hoursFromNow)
	const localTimezone = getLocalTimezone()

	return {
		targetDate: finalTargetDate,
		hoursFromNow,
		local: {
			formatted: formatForTimezone(finalTargetDate, localTimezone),
			timezone: localTimezone,
			abbreviation: getTimezoneAbbreviation(localTimezone, finalTargetDate),
		},
		us: {
			formatted: formatForTimezone(finalTargetDate, TIMEZONES.US),
			timezone: TIMEZONES.US,
			abbreviation: getTimezoneAbbreviation(TIMEZONES.US, finalTargetDate),
		},
		uk: {
			formatted: formatForTimezone(finalTargetDate, TIMEZONES.UK),
			timezone: TIMEZONES.UK,
			abbreviation: getTimezoneAbbreviation(TIMEZONES.UK, finalTargetDate),
		},
	}
}

/**
 * Get a friendly name for a timezone (for display in UI)
 */
export function getTimezoneFriendlyName(timeZone: string): string {
	const names: Record<string, string> = {
		"America/New_York": "US (ET)",
		"Europe/London": "UK",
	}

	return names[timeZone] || timeZone.split("/").pop()?.replace(/_/g, " ") || timeZone
}

/**
 * Format time as short format like "8:00pm"
 */
export function formatTimeShort(date: Date | null | undefined): string {
	if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
		return "N/A"
	}
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	})
		.format(date)
		.toLowerCase()
		.replace(/\s+/g, "") // Replace all whitespace
}

/**
 * Apply random minutes offset (+/- range)
 */
export function applyRandomMinutes(date: Date, range: number): Date {
	if (!Number.isFinite(range) || range < 0) {
		console.warn("[timeUtils] Invalid range for applyRandomMinutes, returning original date")
		return date
	}
	if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
		console.warn("[timeUtils] Invalid date for applyRandomMinutes")
		return new Date()
	}
	const randomOffset = Math.floor(Math.random() * (range * 2 + 1)) - range
	return new Date(date.getTime() + randomOffset * 60 * 1000)
}
