/**
 * Background service worker for Twitter Schedule Shortcuts
 *
 * Currently minimal - handles extension lifecycle events.
 * Can be extended later for features like:
 * - Badge updates
 * - Context menu items
 * - Cross-tab communication
 */

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener(details => {
	if (details.reason === "install") {
		console.log("[Twitter Schedule Shortcuts] Extension installed")
	} else if (details.reason === "update") {
		console.log(
			`[Twitter Schedule Shortcuts] Extension updated to version ${chrome.runtime.getManifest().version}`
		)
	}
})

// Keep the service worker alive (optional, for debugging)
console.log("[Twitter Schedule Shortcuts] Background service worker loaded")
