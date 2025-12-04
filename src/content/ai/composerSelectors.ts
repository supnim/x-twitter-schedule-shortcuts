/**
 * DOM selectors and helpers for interacting with Twitter's tweet composer
 */

export const AI_ENHANCE_ROOT_ID = "twitter-ai-enhance-root"

/**
 * Find the tweet composer textarea/contenteditable element
 * Twitter uses a contenteditable div with data-testid="tweetTextarea_0"
 */
export function findComposer(): HTMLElement | null {
	// Primary selector: the main tweet composer
	const composer = document.querySelector<HTMLElement>('[data-testid="tweetTextarea_0"]')
	if (composer) return composer

	// Fallback: reply composer
	const replyComposer = document.querySelector<HTMLElement>('[data-testid="tweetTextarea_1"]')
	if (replyComposer) return replyComposer

	// Fallback: any tweet text area
	const anyComposer = document.querySelector<HTMLElement>('[data-testid^="tweetTextarea"]')
	if (anyComposer) return anyComposer

	return null
}

/**
 * Find the composer's toolbar (where media buttons etc. are)
 * This is where we'll inject our enhance button
 */
export function findComposerToolbar(): HTMLElement | null {
	// The toolbar is typically the row with media, gif, poll buttons
	// It's inside a div with role="group" near the tweet button
	const tweetButton = document.querySelector<HTMLElement>('[data-testid="tweetButton"]')
	if (!tweetButton) {
		// Also check for tweetButtonInline (used in some contexts)
		const inlineButton = document.querySelector<HTMLElement>('[data-testid="tweetButtonInline"]')
		if (!inlineButton) return null

		// Find the toolbar row - it's usually a sibling container
		const toolbarRow = inlineButton.closest('[role="group"]')?.parentElement
		if (toolbarRow) {
			const toolbar = toolbarRow.querySelector('[role="group"]')
			return toolbar as HTMLElement | null
		}
		return null
	}

	// Navigate up to find the toolbar group
	// The tweet button is usually in a row with the toolbar
	const parentRow = tweetButton.parentElement?.parentElement
	if (parentRow) {
		const toolbar = parentRow.querySelector('[role="group"]')
		return toolbar as HTMLElement | null
	}

	return null
}

/**
 * Find the composer container (the full compose box area)
 */
export function findComposerContainer(): HTMLElement | null {
	const composer = findComposer()
	if (!composer) return null

	// Walk up to find a suitable container
	// Look for the toolbox row parent or the outer compose container
	let element: HTMLElement | null = composer
	while (element && element !== document.body) {
		// Check if this contains both the textarea and the toolbar
		if (
			element.querySelector('[data-testid^="tweetTextarea"]') &&
			element.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]')
		) {
			return element
		}
		element = element.parentElement
	}

	return null
}

/**
 * Get the text content from the composer
 */
export function getComposerText(): string {
	const composer = findComposer()
	if (!composer) return ""

	// The composer is a contenteditable div, get its text content
	// Twitter structures content with span elements, but textContent should work
	return composer.textContent || ""
}

/**
 * Set text in the composer
 * This needs to trigger React's synthetic events properly
 */
export function setComposerText(text: string): boolean {
	const composer = findComposer()
	if (!composer) return false

	// Focus the composer first
	composer.focus()

	// Select all existing text
	const selection = window.getSelection()
	const range = document.createRange()
	range.selectNodeContents(composer)
	selection?.removeAllRanges()
	selection?.addRange(range)

	// Use clipboard API to paste - Twitter handles paste events properly
	// This ensures the text integrates with Draft.js state
	const clipboardData = new DataTransfer()
	clipboardData.setData("text/plain", text)

	const pasteEvent = new ClipboardEvent("paste", {
		bubbles: true,
		cancelable: true,
		clipboardData: clipboardData,
	})

	// Dispatch paste event - Twitter's Draft.js will handle this
	composer.dispatchEvent(pasteEvent)

	// Fallback: if paste didn't work, try execCommand
	if (composer.textContent !== text) {
		document.execCommand("selectAll", false)
		document.execCommand("insertText", false, text)
	}

	return true
}

/**
 * Check if the composer has any text
 */
export function composerHasText(): boolean {
	return getComposerText().trim().length > 0
}

/**
 * Check if we're currently on a page with a composer visible
 */
export function isComposerVisible(): boolean {
	const composer = findComposer()
	if (!composer) return false

	// Check if the composer is actually visible
	const rect = composer.getBoundingClientRect()
	return rect.width > 0 && rect.height > 0
}
