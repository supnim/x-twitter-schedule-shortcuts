/**
 * DOM selectors and helpers for interacting with Twitter's schedule modal
 */

export const EXTENSION_ROOT_ID = "twitter-schedule-shortcuts-root";

/**
 * Find the schedule modal in the DOM
 * Modal root: div[role="dialog"][aria-labelledby="modal-header"]
 * Header text should contain "Schedule"
 */
export function findScheduleModal(): HTMLElement | null {
	const dialogs = document.querySelectorAll<HTMLElement>(
		'div[role="dialog"][aria-labelledby="modal-header"]'
	);

	for (const dialog of dialogs) {
		const header = dialog.querySelector<HTMLElement>("#modal-header");
		if (header && /Schedule/i.test(header.textContent || "")) {
			return dialog;
		}
	}

	return null;
}

/**
 * Set a select element's value and dispatch events to trigger React updates
 * React overrides the native value setter, so we need to use the native setter
 * and dispatch events that React's synthetic event system listens to.
 */
export function setSelectValue(select: HTMLSelectElement | null, value: string): boolean {
	if (!select) return false;

	const option = Array.from(select.options).find((opt) => opt.value === value);
	if (option) {
		// Get the native value setter from HTMLSelectElement prototype
		const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
			HTMLSelectElement.prototype,
			"value"
		)?.set;

		if (nativeSelectValueSetter) {
			// Use the native setter to bypass React's synthetic value
			nativeSelectValueSetter.call(select, value);
		} else {
			// Fallback to direct assignment
			select.value = value;
		}

		// Dispatch events that React listens to
		// React uses 'input' event for controlled components
		const inputEvent = new Event("input", { bubbles: true, cancelable: true });
		select.dispatchEvent(inputEvent);

		// Also dispatch 'change' event for good measure
		const changeEvent = new Event("change", { bubbles: true, cancelable: true });
		select.dispatchEvent(changeEvent);

		return true;
	}
	return false;
}

/**
 * Find a select element by its label text within the modal.
 * Twitter associates labels with selects via aria-labelledby pointing to label IDs.
 */
function findSelectByLabelText(modal: HTMLElement, labelText: string): HTMLSelectElement | null {
	// Find all labels in the modal
	const labels = modal.querySelectorAll<HTMLLabelElement>("label");

	for (const label of labels) {
		if (label.textContent?.trim() === labelText) {
			// The label has an ID like "SELECTOR_1_LABEL", and the select has aria-labelledby pointing to it
			const labelId = label.id;
			if (labelId) {
				const select = modal.querySelector<HTMLSelectElement>(
					`select[aria-labelledby="${labelId}"]`
				);
				if (select) return select;
			}
		}
	}

	return null;
}

/**
 * Apply a target date/time to Twitter's schedule selectors.
 * Finds selectors by their label text (Month, Day, Year, Hour, Minute) to handle dynamic IDs.
 */
export async function applyTimeToSelectors(modal: HTMLElement, targetDate: Date): Promise<void> {
	// Validate modal is still in DOM
	if (!document.body.contains(modal)) {
		throw new Error("Modal no longer in DOM");
	}

	const year = targetDate.getFullYear();
	const month = targetDate.getMonth() + 1; // 1-12
	const day = targetDate.getDate(); // 1-31
	const hour = targetDate.getHours(); // 0-23
	const minute = targetDate.getMinutes(); // 0-59

	// Helper to set value with small delay for React to process
	const setWithDelay = async (labelText: string, value: string) => {
		// Re-validate modal before each selector
		if (!document.body.contains(modal)) {
			throw new Error(`Modal removed during selector update: ${labelText}`);
		}

		const select = findSelectByLabelText(modal, labelText);

		if (!select) {
			console.warn(`[Twitter Schedule Shortcuts] Could not find selector with label: ${labelText}`);
			return;
		}

		const success = setSelectValue(select, value);
		if (!success) {
			console.warn(`[Twitter Schedule Shortcuts] Failed to set ${labelText} to ${value}`);
		}
		// Small delay to let React process the change
		await new Promise((resolve) => setTimeout(resolve, 50));
	};

	// Set values in order with delays
	// Date selectors first (month affects available days)
	await setWithDelay("Month", String(month));
	await setWithDelay("Day", String(day));
	await setWithDelay("Year", String(year));

	// Then time selectors
	await setWithDelay("Hour", String(hour));
	await setWithDelay("Minute", String(minute));
}

/**
 * Find the "Will send on..." preview element to insert our UI before
 */
export function findPreviewElement(modal: HTMLElement): HTMLElement | null {
	// Look for text that starts with "Will send on"
	const walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) => {
			if (node.textContent?.includes("Will send on")) {
				return NodeFilter.FILTER_ACCEPT;
			}
			return NodeFilter.FILTER_REJECT;
		},
	});

	const textNode = walker.nextNode();
	if (textNode?.parentElement) {
		// Walk up to find a suitable container element
		let element: HTMLElement | null = textNode.parentElement;
		while (element && element !== modal) {
			// Look for the parent row container
			if (element.previousElementSibling || element.parentElement !== modal) {
				// Found a suitable insertion point
				const container = element.closest('[data-testid], [role="presentation"]') || element;
				return container as HTMLElement;
			}
			element = element.parentElement;
		}
		return textNode.parentElement;
	}

	return null;
}

/**
 * Check if Twitter is in dark mode
 */
export function isTwitterDarkMode(): boolean {
	// Use prefers-color-scheme media query
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
