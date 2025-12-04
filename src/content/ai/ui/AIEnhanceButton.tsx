import { AlertCircle, Loader2, Sparkles, Undo2 } from "lucide-react"
import type React from "react"
import { type FC, useCallback, useEffect, useRef, useState } from "react"
import { getComposerText, setComposerText } from "../composerSelectors"
import { enhanceTweet } from "../openai"
import { type AISettings, loadAISettings } from "../storage"

const DEFAULT_TWITTER_BLUE = "#1d9bf0"

/**
 * Detect Twitter's accent color from existing UI elements
 */
function getTwitterAccentColor(): string {
	// Try to get color from tweet button (most reliable)
	const tweetButton = document.querySelector<HTMLElement>(
		'[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
	)
	if (tweetButton) {
		const bgColor = window.getComputedStyle(tweetButton).backgroundColor
		if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
			return bgColor
		}
	}

	// Fallback: check toolbar icons (they use the accent color)
	const toolbarIcon = document.querySelector<SVGElement>(
		'[data-testid="gifPicker"] svg, [data-testid="emojiPicker"] svg'
	)
	if (toolbarIcon) {
		const color = window.getComputedStyle(toolbarIcon).color
		if (color && color !== "rgba(0, 0, 0, 0)") {
			return color
		}
	}

	return DEFAULT_TWITTER_BLUE
}

export const AIEnhanceButton: FC = () => {
	const [settings, setSettings] = useState<AISettings | null>(null)
	const [isEnhancing, setIsEnhancing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [originalText, setOriginalText] = useState<string | null>(null)
	const [accentColor, setAccentColor] = useState(DEFAULT_TWITTER_BLUE)
	const isMountedRef = useRef(true)

	useEffect(() => {
		isMountedRef.current = true
		// Detect accent color on mount
		setAccentColor(getTwitterAccentColor())
		return () => {
			isMountedRef.current = false
		}
	}, [])

	useEffect(() => {
		loadAISettings().then(loadedSettings => {
			if (isMountedRef.current) {
				setSettings(loadedSettings)
			}
		})
	}, [])

	// Listen for storage changes (when user saves settings in popup)
	useEffect(() => {
		const handleStorageChange = () => {
			loadAISettings().then(loadedSettings => {
				if (isMountedRef.current) {
					setSettings(loadedSettings)
				}
			})
		}

		chrome.storage.onChanged.addListener(handleStorageChange)
		return () => chrome.storage.onChanged.removeListener(handleStorageChange)
	}, [])

	const handleEnhance = useCallback(async () => {
		if (!settings?.apiKey) {
			setError("Set up API key in extension popup")
			setTimeout(() => setError(null), 3000)
			return
		}

		const currentText = getComposerText()
		if (!currentText.trim()) {
			setError("Write something first!")
			setTimeout(() => setError(null), 3000)
			return
		}

		setIsEnhancing(true)
		setError(null)
		setOriginalText(currentText)

		const result = await enhanceTweet(currentText, settings.prompt, settings.apiKey, settings.model)

		if (!isMountedRef.current) return
		setIsEnhancing(false)

		if (result.success) {
			setComposerText(result.text)
		} else {
			setError(result.error.message)
			setTimeout(() => setError(null), 5000)
		}
	}, [settings])

	const handleUndo = useCallback(() => {
		if (originalText) {
			setComposerText(originalText)
			setOriginalText(null)
		}
	}, [originalText])

	const hasApiKey = !!settings?.apiKey

	const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${accentColor} 10%, transparent)`
	}

	const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.currentTarget.style.backgroundColor = "transparent"
	}

	return (
		<div className="relative inline-flex items-center gap-1">
			<button
				type="button"
				onClick={handleEnhance}
				disabled={isEnhancing}
				className="p-2 rounded-full transition-colors disabled:opacity-50"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				title={hasApiKey ? "Enhance with AI" : "Set up API key in extension popup first"}
			>
				{isEnhancing ? (
					<Loader2 className="h-5 w-5 animate-spin" style={{ color: accentColor }} />
				) : (
					<Sparkles className="h-5 w-5" style={{ color: accentColor }} />
				)}
			</button>

			{originalText && (
				<button
					type="button"
					onClick={handleUndo}
					className="p-2 rounded-full transition-colors"
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					title="Undo AI changes"
				>
					<Undo2 className="h-5 w-5" style={{ color: accentColor }} />
				</button>
			)}

			{error && (
				<div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg shadow-lg z-50 whitespace-nowrap">
					<p className="text-xs text-destructive flex items-center gap-1.5">
						<AlertCircle className="h-3 w-3 flex-shrink-0" />
						{error}
					</p>
				</div>
			)}
		</div>
	)
}
