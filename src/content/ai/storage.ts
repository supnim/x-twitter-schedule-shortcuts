/**
 * Storage utilities for AI enhancement feature
 */

export interface AISettings {
	apiKey: string
	model: string
	prompt: string
	enabled: boolean
}

export const AI_STORAGE_KEYS = {
	API_KEY: "tss_openai_api_key",
	MODEL: "tss_openai_model",
	PROMPT: "tss_openai_prompt",
	ENABLED: "tss_ai_enabled",
} as const

export const DEFAULT_PROMPT = `You are a worldclass ghostwriter for the best twitter/x influencers.
Your target audience: tech bros and startup founders.
Brand voice: witty, bold, no BS. The goal: maximise engagement (likes, retweets, replies).

Rewrite this draft tweet, keeping these in mind:
- Opens with a strong hook (shock, question, bold claim)
- Delivers one clear insight or call-out about given draft
- Invites the audience to reply or share their story

Keeps tone: informal, slightly irreverent, confident.
Only output the rewritten tweet, no explanations or preamble.`

export const DEFAULT_AI_SETTINGS: AISettings = {
	apiKey: "",
	model: "gpt-5-mini",
	prompt: DEFAULT_PROMPT,
	enabled: false,
}

export const AVAILABLE_MODELS = [
	{ id: "gpt-5-mini", name: "GPT-5 Mini (Fast & Cheap)" },
	{ id: "gpt-5.1", name: "GPT-5.1 (Best for Coding)" },
	{ id: "gpt-5-nano", name: "GPT-5 Nano (Fastest)" },
] as const

/**
 * Check if extension context is valid
 */
function isExtensionContextValid(): boolean {
	try {
		return !!(chrome?.storage?.local && chrome?.runtime?.id)
	} catch {
		return false
	}
}

/**
 * Load AI settings from chrome.storage.local
 */
export async function loadAISettings(): Promise<AISettings> {
	if (!isExtensionContextValid()) {
		console.warn("[AI Enhance] Extension context not available")
		return DEFAULT_AI_SETTINGS
	}

	return new Promise(resolve => {
		try {
			chrome.storage.local.get(
				[
					AI_STORAGE_KEYS.API_KEY,
					AI_STORAGE_KEYS.MODEL,
					AI_STORAGE_KEYS.PROMPT,
					AI_STORAGE_KEYS.ENABLED,
				],
				result => {
					if (chrome.runtime.lastError) {
						console.warn("[AI Enhance] Storage read failed:", chrome.runtime.lastError)
						resolve(DEFAULT_AI_SETTINGS)
						return
					}

					resolve({
						apiKey: result[AI_STORAGE_KEYS.API_KEY] || "",
						model: result[AI_STORAGE_KEYS.MODEL] || DEFAULT_AI_SETTINGS.model,
						prompt: result[AI_STORAGE_KEYS.PROMPT] || DEFAULT_AI_SETTINGS.prompt,
						enabled: result[AI_STORAGE_KEYS.ENABLED] ?? false,
					})
				}
			)
		} catch {
			resolve(DEFAULT_AI_SETTINGS)
		}
	})
}

/**
 * Save AI settings to chrome.storage.local
 */
export async function saveAISettings(settings: Partial<AISettings>): Promise<boolean> {
	if (!isExtensionContextValid()) {
		console.warn("[AI Enhance] Extension context not available")
		return false
	}

	return new Promise(resolve => {
		try {
			const updates: Record<string, unknown> = {}

			if (settings.apiKey !== undefined) {
				updates[AI_STORAGE_KEYS.API_KEY] = settings.apiKey
			}
			if (settings.model !== undefined) {
				updates[AI_STORAGE_KEYS.MODEL] = settings.model
			}
			if (settings.prompt !== undefined) {
				updates[AI_STORAGE_KEYS.PROMPT] = settings.prompt
			}
			if (settings.enabled !== undefined) {
				updates[AI_STORAGE_KEYS.ENABLED] = settings.enabled
			}

			chrome.storage.local.set(updates, () => {
				if (chrome.runtime.lastError) {
					console.warn("[AI Enhance] Storage write failed:", chrome.runtime.lastError)
					resolve(false)
					return
				}
				resolve(true)
			})
		} catch {
			resolve(false)
		}
	})
}

/**
 * Clear API key from storage
 */
export async function clearAPIKey(): Promise<boolean> {
	if (!isExtensionContextValid()) {
		return false
	}

	return new Promise(resolve => {
		try {
			chrome.storage.local.remove([AI_STORAGE_KEYS.API_KEY], () => {
				if (chrome.runtime.lastError) {
					resolve(false)
					return
				}
				resolve(true)
			})
		} catch {
			resolve(false)
		}
	})
}
