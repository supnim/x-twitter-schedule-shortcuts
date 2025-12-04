/**
 * AI Enhancement feature entry point
 * Injects the AI enhance button near the tweet composer
 */

import { type Root, createRoot } from "react-dom/client"
import { isTwitterDarkMode } from "../twitterSelectors"
import { AI_ENHANCE_ROOT_ID, findComposerToolbar } from "./composerSelectors"
import { AIEnhanceButton } from "./ui/AIEnhanceButton"

let currentRoot: Root | null = null
let currentObserver: MutationObserver | null = null
let checkTimeout: ReturnType<typeof setTimeout> | null = null
let isMounting = false

/**
 * Find a good insertion point for our AI button
 * We want to insert it in the toolbar area, near the other action buttons
 */
function findInsertionPoint(): { parent: HTMLElement; before: HTMLElement | null } | null {
	const toolbar = findComposerToolbar()
	if (toolbar) {
		// Insert at the beginning of the toolbar
		return {
			parent: toolbar,
			before: toolbar.firstElementChild as HTMLElement | null,
		}
	}

	// Alternative: Find the area near the tweet button
	const tweetButton = document.querySelector<HTMLElement>(
		'[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
	)
	if (tweetButton?.parentElement) {
		return {
			parent: tweetButton.parentElement,
			before: tweetButton,
		}
	}

	return null
}

/**
 * Mount the AI enhance button
 */
function mountAIButton(): void {
	if (isMounting) return

	// Check if already mounted
	if (document.getElementById(AI_ENHANCE_ROOT_ID)) {
		return
	}

	const insertionPoint = findInsertionPoint()
	if (!insertionPoint) return

	isMounting = true

	try {
		const rootContainer = document.createElement("div")
		rootContainer.id = AI_ENHANCE_ROOT_ID
		rootContainer.style.display = "inline-flex"
		rootContainer.style.alignItems = "center"

		if (isTwitterDarkMode()) {
			rootContainer.classList.add("dark")
		}

		insertionPoint.parent.insertBefore(rootContainer, insertionPoint.before)

		currentRoot = createRoot(rootContainer)
		currentRoot.render(<AIEnhanceButton />)

		console.log("[AI Enhance] Mounted successfully")
	} catch (error) {
		console.error("[AI Enhance] Failed to mount:", error)
	} finally {
		isMounting = false
	}
}

/**
 * Unmount the AI enhance button
 */
function unmountAIButton(): void {
	if (currentRoot) {
		currentRoot.unmount()
		currentRoot = null
	}

	const rootElement = document.getElementById(AI_ENHANCE_ROOT_ID)
	if (rootElement) {
		rootElement.remove()
	}
}

/**
 * Check for composer and mount/unmount accordingly
 */
function checkForComposer(): void {
	const existingRoot = document.getElementById(AI_ENHANCE_ROOT_ID)
	const insertionPoint = findInsertionPoint()

	if (insertionPoint) {
		// Composer toolbar is present
		if (!existingRoot) {
			mountAIButton()
		} else if (!insertionPoint.parent.contains(existingRoot)) {
			// Our element exists but is orphaned - remount
			unmountAIButton()
			mountAIButton()
		}
	} else {
		// No composer toolbar
		if (existingRoot) {
			unmountAIButton()
		}
	}
}

/**
 * Update theme when Twitter changes
 */
function updateTheme(): void {
	const rootElement = document.getElementById(AI_ENHANCE_ROOT_ID)
	if (rootElement) {
		if (isTwitterDarkMode()) {
			rootElement.classList.add("dark")
		} else {
			rootElement.classList.remove("dark")
		}
	}
}

/**
 * Initialize the AI enhancement observer
 */
export function initAIEnhance(): void {
	if (currentObserver) {
		currentObserver.disconnect()
		currentObserver = null
	}

	// Initial check
	checkForComposer()

	// Debounced check
	const debouncedCheck = () => {
		if (checkTimeout) return
		checkTimeout = setTimeout(() => {
			checkTimeout = null
			checkForComposer()
		}, 100)
	}

	// Observe DOM changes
	currentObserver = new MutationObserver(mutations => {
		let shouldCheck = false

		for (const mutation of mutations) {
			const target = mutation.target as HTMLElement

			// Ignore our own mutations
			if (target.id === AI_ENHANCE_ROOT_ID || target.closest?.(`#${AI_ENHANCE_ROOT_ID}`)) {
				continue
			}

			if (mutation.type === "childList") {
				// Check if composer-related elements were added/removed
				if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
					shouldCheck = true
				}
			} else if (mutation.type === "attributes") {
				// Theme changes
				if (target === document.body || target === document.documentElement) {
					updateTheme()
				}
			}
		}

		if (shouldCheck) {
			debouncedCheck()
		}
	})

	currentObserver.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["style", "class", "data-color-mode"],
	})

	console.log("[AI Enhance] Observer initialized")
}

/**
 * Cleanup AI enhancement feature
 */
export function cleanupAIEnhance(): void {
	if (currentObserver) {
		currentObserver.disconnect()
		currentObserver = null
	}
	if (checkTimeout) {
		clearTimeout(checkTimeout)
		checkTimeout = null
	}
	unmountAIButton()
}
