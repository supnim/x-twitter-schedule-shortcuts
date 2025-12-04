/**
 * OpenAI API service for tweet enhancement
 */

export interface OpenAIError {
	type: "invalid_key" | "rate_limit" | "network" | "api_error" | "unknown"
	message: string
}

export interface EnhanceResult {
	success: true
	text: string
}

export interface EnhanceError {
	success: false
	error: OpenAIError
}

export type EnhanceResponse = EnhanceResult | EnhanceError

interface OpenAIChatResponse {
	id: string
	object: string
	created: number
	model: string
	choices: {
		index: number
		message: {
			role: string
			content: string
		}
		finish_reason: string
	}[]
	usage: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
}

interface OpenAIErrorResponse {
	error: {
		message: string
		type: string
		code: string | null
	}
}

/**
 * Enhance tweet text using OpenAI API
 */
export async function enhanceTweet(
	text: string,
	systemPrompt: string,
	apiKey: string,
	model: string
): Promise<EnhanceResponse> {
	if (!apiKey) {
		return {
			success: false,
			error: {
				type: "invalid_key",
				message: "API key is not configured",
			},
		}
	}

	if (!text.trim()) {
		return {
			success: false,
			error: {
				type: "api_error",
				message: "No text to enhance",
			},
		}
	}

	try {
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: text },
				],
				max_tokens: 300,
				temperature: 0.7,
			}),
		})

		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as OpenAIErrorResponse

			if (response.status === 401) {
				return {
					success: false,
					error: {
						type: "invalid_key",
						message: "Invalid API key. Please check your OpenAI API key.",
					},
				}
			}

			if (response.status === 429) {
				return {
					success: false,
					error: {
						type: "rate_limit",
						message: "Rate limit exceeded. Please try again later.",
					},
				}
			}

			return {
				success: false,
				error: {
					type: "api_error",
					message: errorData.error?.message || `API error: ${response.status}`,
				},
			}
		}

		const data = (await response.json()) as OpenAIChatResponse

		const enhancedText = data.choices[0]?.message?.content?.trim()
		if (!enhancedText) {
			return {
				success: false,
				error: {
					type: "api_error",
					message: "No response from AI",
				},
			}
		}

		return {
			success: true,
			text: enhancedText,
		}
	} catch (error) {
		if (error instanceof TypeError && error.message.includes("fetch")) {
			return {
				success: false,
				error: {
					type: "network",
					message: "Network error. Please check your connection.",
				},
			}
		}

		return {
			success: false,
			error: {
				type: "unknown",
				message: error instanceof Error ? error.message : "An unknown error occurred",
			},
		}
	}
}

/**
 * Validate an API key by making a simple models list request
 */
export async function validateAPIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
	// OpenAI keys can have various prefixes: sk-, sk-proj-, etc.
	if (!apiKey || apiKey.length < 20) {
		return { valid: false, error: "Invalid key format" }
	}

	try {
		const response = await fetch("https://api.openai.com/v1/models", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		})

		if (response.ok) {
			return { valid: true }
		}

		if (response.status === 401) {
			return { valid: false, error: "Invalid API key" }
		}

		return { valid: false, error: `API returned status ${response.status}` }
	} catch {
		return { valid: false, error: "Network error" }
	}
}
