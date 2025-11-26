import { type Root, createRoot } from "react-dom/client"
import {
	EXTENSION_ROOT_ID,
	findPreviewElement,
	findScheduleModal,
	isTwitterDarkMode,
} from "./twitterSelectors"
import { QuickScheduleRoot } from "./ui/QuickScheduleRoot"
import "@/styles/globals.css"

let currentRoot: Root | null = null
let currentModal: HTMLElement | null = null
let currentObserver: MutationObserver | null = null
let checkTimeout: ReturnType<typeof setTimeout> | null = null
let mountAbortController: AbortController | null = null
let initialized = false
let isApplyingTime = false // Flag to prevent unmounting during time application
let applyingTimeTimeout: ReturnType<typeof setTimeout> | null = null
let isMounting = false // Flag to prevent double mounting

/**
 * Find a stable insertion point in the modal (at the top of the content area)
 */
function findStableInsertionPoint(
	modal: HTMLElement
): { parent: HTMLElement; before: HTMLElement | null } | null {
	// Strategy 1: Find the Date group and go up to find the content container
	// Date group is [aria-label="Date"], its grandparent is the content section,
	// and that section's parent is the scrollable content area
	const dateGroup = modal.querySelector('[aria-label="Date"]')
	if (dateGroup) {
		// Walk up: Date group -> Date section -> Content area (with Will send, Date, Time sections)
		const container = dateGroup.parentElement?.parentElement
		if (container) {
			// Insert at the top of this content area
			return {
				parent: container,
				before: container.firstElementChild as HTMLElement | null,
			}
		}
	}

	// Strategy 2: Find the "Will send on" text and insert before its container
	const previewElement = findPreviewElement(modal)
	if (previewElement?.parentElement) {
		return {
			parent: previewElement.parentElement,
			before: previewElement,
		}
	}

	// Strategy 3: Find the Confirm button and insert after its container
	const confirmBtn = modal.querySelector('[data-testid="scheduledConfirmationPrimaryAction"]')
	if (confirmBtn) {
		// Walk up to find the header row
		let headerRow = confirmBtn.parentElement
		while (headerRow && headerRow !== modal) {
			if (headerRow.nextElementSibling) {
				return {
					parent: headerRow.parentElement!,
					before: headerRow.nextElementSibling as HTMLElement,
				}
			}
			headerRow = headerRow.parentElement
		}
	}

	return null
}

/**
 * Insert root element at stable position in modal
 */
function insertRootElement(modal: HTMLElement, rootElement: HTMLElement): boolean {
	const insertionPoint = findStableInsertionPoint(modal)
	if (insertionPoint) {
		insertionPoint.parent.insertBefore(rootElement, insertionPoint.before)
		return true
	}
	// Last resort
	modal.appendChild(rootElement)
	return true
}

/**
 * Set the applying time flag - called from QuickScheduleRoot
 */
export function setApplyingTime(value: boolean): void {
	isApplyingTime = value

	// Clear any pending cooldown on new apply
	if (value && applyingTimeTimeout) {
		clearTimeout(applyingTimeTimeout)
		applyingTimeTimeout = null
	}

	// If we just finished applying, add extra cooldown before allowing checks
	if (!value) {
		applyingTimeTimeout = setTimeout(() => {
			applyingTimeTimeout = null

			// Re-check modal and our element after cooldown
			const modal = findScheduleModal()
			const existingRoot = document.getElementById(EXTENSION_ROOT_ID)

			if (modal) {
				if (!existingRoot) {
					// Our element was completely removed - remount
					console.log("[Twitter Schedule Shortcuts] Element removed during apply, remounting...")
					mountApp(modal).catch(error => {
						console.error("[Twitter Schedule Shortcuts] Failed to remount:", error)
					})
				} else if (!modal.contains(existingRoot)) {
					// Element exists but orphaned - re-insert
					insertRootElement(modal, existingRoot)
				}
			}
		}, 300)
	}
}

/**
 * Mount the React app into the schedule modal
 */
async function mountApp(modal: HTMLElement): Promise<void> {
	isMounting = true

	try {
		// Create abort controller for this mount operation
		mountAbortController = new AbortController()
		const signal = mountAbortController.signal

		// Check if already mounted
		if (document.getElementById(EXTENSION_ROOT_ID)) {
			isMounting = false
			return
		}

		// Small delay to ensure Twitter's modal is fully initialized
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(resolve, 100)
			const abortHandler = () => {
				clearTimeout(timeout)
				reject(new Error("Mount aborted"))
			}
			signal.addEventListener("abort", abortHandler, { once: true })
		}).catch(() => {
			// Aborted, exit early
			return
		})

		if (signal.aborted) {
			isMounting = false
			return
		}

		// Verify modal still exists after delay
		if (!document.body.contains(modal)) {
			isMounting = false
			return
		}

		// Double-check we haven't already mounted during the delay
		if (document.getElementById(EXTENSION_ROOT_ID)) {
			isMounting = false
			return
		}

		// Create our root container
		const rootContainer = document.createElement("div")
		rootContainer.id = EXTENSION_ROOT_ID

		// Apply dark mode class if needed
		if (isTwitterDarkMode()) {
			rootContainer.classList.add("dark")
		}

		// Insert at stable position
		insertRootElement(modal, rootContainer)

		// Final check before creating React root
		if (signal.aborted) {
			rootContainer.remove()
			isMounting = false
			return
		}

		// Create React root and render
		currentRoot = createRoot(rootContainer)
		currentRoot.render(<QuickScheduleRoot modal={modal} />)
		currentModal = modal

		console.log("[Twitter Schedule Shortcuts] Mounted successfully")
	} finally {
		isMounting = false
	}
}

/**
 * Unmount the React app and clean up
 */
function unmountApp(): void {
	// Abort any pending mount operations
	if (mountAbortController) {
		mountAbortController.abort()
		mountAbortController = null
	}

	if (currentRoot) {
		currentRoot.unmount()
		currentRoot = null
	}

	const rootElement = document.getElementById(EXTENSION_ROOT_ID)
	if (rootElement) {
		rootElement.remove()
	}

	currentModal = null
}

/**
 * Reposition our UI element to the correct location in the modal
 */
function repositionRoot(modal: HTMLElement, rootElement: HTMLElement): void {
	try {
		const insertionPoint = findStableInsertionPoint(modal)
		if (!insertionPoint) return

		// Check if we're already in the right position
		if (
			rootElement.parentElement === insertionPoint.parent &&
			rootElement.nextElementSibling === insertionPoint.before
		) {
			return // Already in correct position
		}

		// Move to correct position
		insertionPoint.parent.insertBefore(rootElement, insertionPoint.before)
	} catch (error) {
		console.error("[Twitter Schedule Shortcuts] Failed to reposition:", error)
	}
}

/**
 * Check for schedule modal and mount/unmount accordingly
 */
function checkForModal(): void {
	// Don't unmount while we're applying time changes
	if (isApplyingTime) {
		return
	}

	const modal = findScheduleModal()
	const existingRoot = document.getElementById(EXTENSION_ROOT_ID)

	// Verify currentModal is still in DOM (detect stale references)
	if (currentModal && !document.body.contains(currentModal)) {
		unmountApp()
	}

	if (modal) {
		// Modal is present
		if (existingRoot && modal.contains(existingRoot)) {
			// Our UI is still in the modal, check if it needs repositioning
			repositionRoot(modal, existingRoot)
			currentModal = modal
			return
		}

		if (existingRoot && !modal.contains(existingRoot)) {
			// Our UI exists but is not in this modal - try to re-insert it
			if (insertRootElement(modal, existingRoot)) {
				currentModal = modal
				return
			}
			// Couldn't re-insert, unmount
			unmountApp()
		}

		if (!existingRoot && !mountAbortController && !isMounting) {
			// No UI mounted yet and no pending mount, mount it
			mountApp(modal).catch(error => {
				console.error("[Twitter Schedule Shortcuts] Failed to mount:", error)
			})
		}
	} else {
		// Modal is not present
		if (currentModal || existingRoot) {
			unmountApp()
		}
	}
}

let lastThemeState: boolean | null = null

/**
 * Watch for theme changes and update our root element
 */
function updateTheme(): void {
	const currentDarkMode = isTwitterDarkMode()

	// Only update if theme actually changed
	if (currentDarkMode === lastThemeState) {
		return
	}

	lastThemeState = currentDarkMode
	const rootElement = document.getElementById(EXTENSION_ROOT_ID)
	if (rootElement) {
		if (currentDarkMode) {
			rootElement.classList.add("dark")
		} else {
			rootElement.classList.remove("dark")
		}
	}
}

/**
 * Cleanup all resources
 */
function cleanup(): void {
	if (currentObserver) {
		currentObserver.disconnect()
		currentObserver = null
	}
	if (checkTimeout) {
		clearTimeout(checkTimeout)
		checkTimeout = null
	}
	if (applyingTimeTimeout) {
		clearTimeout(applyingTimeTimeout)
		applyingTimeTimeout = null
	}
	if (mountAbortController) {
		mountAbortController.abort()
		mountAbortController = null
	}
	unmountApp()
	initialized = false
}

/**
 * Initialize the MutationObserver to watch for modal changes
 */
function initObserver(): void {
	// Cleanup any existing observer
	if (currentObserver) {
		currentObserver.disconnect()
		currentObserver = null
	}

	// Initial check
	checkForModal()

	// Debounce to prevent excessive checks
	const debouncedCheck = () => {
		if (checkTimeout) return
		checkTimeout = setTimeout(() => {
			checkTimeout = null
			checkForModal()
		}, 50)
	}

	// Create observer for DOM changes
	currentObserver = new MutationObserver(mutations => {
		// Check if any mutation could affect our modal
		let shouldCheck = false

		for (const mutation of mutations) {
			// Ignore mutations from our own extension
			const target = mutation.target as HTMLElement
			if (target.id === EXTENSION_ROOT_ID || target.closest?.(`#${EXTENSION_ROOT_ID}`)) {
				continue
			}

			// Check if any added/removed nodes are our extension root
			if (mutation.type === "childList") {
				let isOurExtension = false
				for (const node of mutation.addedNodes) {
					if (
						node instanceof HTMLElement &&
						(node.id === EXTENSION_ROOT_ID || node.querySelector(`#${EXTENSION_ROOT_ID}`))
					) {
						isOurExtension = true
						break
					}
				}
				for (const node of mutation.removedNodes) {
					if (
						node instanceof HTMLElement &&
						(node.id === EXTENSION_ROOT_ID || node.querySelector(`#${EXTENSION_ROOT_ID}`))
					) {
						isOurExtension = true
						break
					}
				}

				if (isOurExtension) {
					continue
				}

				// Check if dialog elements were added or removed
				if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
					shouldCheck = true
				}
			} else if (mutation.type === "attributes") {
				// Check for theme changes (background color, etc.)
				if (target === document.body || target === document.documentElement) {
					updateTheme()
				}
			}
		}

		if (shouldCheck) {
			debouncedCheck()
		}
	})

	// Start observing
	currentObserver.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["style", "class", "data-color-mode"],
	})

	console.log("[Twitter Schedule Shortcuts] Observer initialized")
}

/**
 * Initialize the extension
 */
function init(): void {
	if (initialized) return
	initialized = true
	initObserver()
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init)
} else {
	init()
}

// Cleanup on unload
window.addEventListener("unload", cleanup)
