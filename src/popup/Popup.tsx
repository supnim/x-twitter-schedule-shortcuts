import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
	Check,
	ChevronDown,
	ChevronUp,
	Eye,
	EyeOff,
	Loader2,
	RotateCcw,
	Shield,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const AI_STORAGE_KEYS = {
	API_KEY: "tss_openai_api_key",
	MODEL: "tss_openai_model",
	PROMPT: "tss_openai_prompt",
}

const DEFAULT_PROMPT = `You are a worldclass ghostwriter for the best twitter/x influencers.
Your target audience: tech bros and startup founders.
Brand voice: witty, bold, no BS. The goal: maximise engagement (likes, retweets, replies).

Rewrite this draft tweet, keeping these in mind:
- Opens with a strong hook (shock, question, bold claim)
- Delivers one clear insight or call-out about given draft
- Invites the audience to reply or share their story

Keeps tone: informal, slightly irreverent, confident.
Only output the rewritten tweet, no explanations or preamble.`

const AVAILABLE_MODELS = [
	{ id: "gpt-5-mini", name: "GPT-5 Mini (Fast & Cheap)" },
	{ id: "gpt-5.1", name: "GPT-5.1 (Best for Coding)" },
	{ id: "gpt-5-nano", name: "GPT-5 Nano (Fastest)" },
]

async function validateAPIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
	if (!apiKey || apiKey.length < 20) {
		return { valid: false, error: "Invalid key format" }
	}

	try {
		const response = await fetch("https://api.openai.com/v1/models", {
			method: "GET",
			headers: { Authorization: `Bearer ${apiKey}` },
		})

		if (response.ok) return { valid: true }
		if (response.status === 401) return { valid: false, error: "Invalid API key" }
		return { valid: false, error: `API returned status ${response.status}` }
	} catch {
		return { valid: false, error: "Network error" }
	}
}

export function Popup() {
	const [apiKey, setApiKey] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)
	const [model, setModel] = useState("gpt-5-mini")
	const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
	const [showKey, setShowKey] = useState(false)
	const [showPrompt, setShowPrompt] = useState(false)
	const [isValidating, setIsValidating] = useState(false)
	const [isSaved, setIsSaved] = useState(false)
	const [error, setError] = useState("")

	useEffect(() => {
		chrome.storage.local.get(
			[AI_STORAGE_KEYS.API_KEY, AI_STORAGE_KEYS.MODEL, AI_STORAGE_KEYS.PROMPT],
			result => {
				if (chrome.runtime.lastError) {
					console.warn("[AI Settings] Storage read failed:", chrome.runtime.lastError)
					return
				}
				if (result[AI_STORAGE_KEYS.API_KEY]) {
					setApiKey(result[AI_STORAGE_KEYS.API_KEY])
				}
				if (result[AI_STORAGE_KEYS.MODEL]) {
					// Validate stored model exists in available models, fallback to default if not
					const storedModel = result[AI_STORAGE_KEYS.MODEL]
					const isValidModel = AVAILABLE_MODELS.some(m => m.id === storedModel)
					setModel(isValidModel ? storedModel : "gpt-5-mini")
				}
				if (result[AI_STORAGE_KEYS.PROMPT]) {
					setPrompt(result[AI_STORAGE_KEYS.PROMPT])
				}
			}
		)
	}, [])

	const handleSave = useCallback(async () => {
		if (!apiKey) {
			setError("Please enter an API key")
			return
		}

		setIsValidating(true)
		setError("")

		const result = await validateAPIKey(apiKey)

		if (!result.valid) {
			setIsValidating(false)
			setError(result.error || "Invalid API key")
			return
		}

		chrome.storage.local.set(
			{
				[AI_STORAGE_KEYS.API_KEY]: apiKey,
				[AI_STORAGE_KEYS.MODEL]: model,
				[AI_STORAGE_KEYS.PROMPT]: prompt,
			},
			() => {
				if (chrome.runtime.lastError) {
					setIsValidating(false)
					setError("Failed to save settings")
					return
				}
				setIsValidating(false)
				setIsSaved(true)
				setTimeout(() => setIsSaved(false), 2000)
			}
		)
	}, [apiKey, model, prompt])

	const handleResetPrompt = useCallback(() => {
		setPrompt(DEFAULT_PROMPT)
	}, [])

	const handleClear = useCallback(() => {
		chrome.storage.local.remove([AI_STORAGE_KEYS.API_KEY], () => {
			if (chrome.runtime.lastError) {
				setError("Failed to clear API key")
				return
			}
			setApiKey("")
			setError("")
		})
	}, [])

	const handlePaste = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			if (text) {
				setApiKey(text)
				setError("")
				// Also set the native input value directly
				if (inputRef.current) {
					inputRef.current.value = text
				}
			}
		} catch (err) {
			console.error("Clipboard read failed:", err)
			setError("Failed to read clipboard")
		}
	}, [])

	const maskedKey = apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : ""

	return (
		<Card className="border-0 shadow-none min-w-sm">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">AI Settings</CardTitle>

				<CardDescription>Configure your OpenAI API key to enhance tweets with AI.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="api-key">OpenAI API Key</Label>
					<div className="relative">
						<Input
							ref={inputRef}
							id="api-key"
							type={showKey ? "text" : "password"}
							value={apiKey}
							onChange={e => {
								setApiKey(e.target.value)
								setError("")
							}}
							placeholder="sk-..."
							className="pr-20"
						/>
						<div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2 text-xs"
								onClick={handlePaste}
								tabIndex={-1}
							>
								Paste
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={() => setShowKey(!showKey)}
								tabIndex={-1}
							>
								{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</Button>
						</div>
					</div>
					{apiKey && !showKey && (
						<p className="text-xs text-muted-foreground">Stored: {maskedKey}</p>
					)}
					{error && <p className="text-xs text-destructive">{error}</p>}
				</div>

				<div className="space-y-2">
					<Label htmlFor="model">Model</Label>
					<Select value={model} onValueChange={setModel}>
						<SelectTrigger id="model">
							<SelectValue placeholder="Select a model" />
						</SelectTrigger>
						<SelectContent>
							{AVAILABLE_MODELS.map(m => (
								<SelectItem key={m.id} value={m.id}>
									{m.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Button
						variant="ghost"
						onClick={() => setShowPrompt(!showPrompt)}
						className="flex items-center justify-between w-full h-auto p-0 text-sm font-medium hover:bg-transparent"
					>
						<Label className="cursor-pointer">System Prompt</Label>
						{showPrompt ? (
							<ChevronUp className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						)}
					</Button>
					{showPrompt && (
						<div className="space-y-2">
							<Textarea
								id="prompt"
								value={prompt}
								onChange={e => setPrompt(e.target.value)}
								placeholder="Enter your system prompt..."
								className="min-h-[120px] text-xs resize-none"
							/>
							<div className="flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleResetPrompt}
									className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
								>
									<RotateCcw className="h-3 w-3 mr-1" />
									Reset to default
								</Button>
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center justify-between pt-2">
					<Button variant="ghost" size="sm" onClick={handleClear} disabled={!apiKey}>
						Clear
					</Button>
					<Button onClick={handleSave} disabled={!apiKey || isValidating} size="sm">
						{isValidating ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Validating...
							</>
						) : isSaved ? (
							<>
								<Check className="h-4 w-4" />
								Saved!
							</>
						) : (
							"Save"
						)}
					</Button>
				</div>
				<div className="flex flex-row p-4 gap-2 items-center justify-between pt-2 border-t border-border">
					<Shield className="text-lime-500" />
					<p className="text-xs text-lime-500 r">
						Your API key is safely stored locally and only sent to OpenAI.
					</p>
				</div>

				<div className="pt-4 border-t border-border space-y-2">
					<p className="text-xs font-medium text-muted-foreground">About</p>
					<p className="text-xs text-muted-foreground">
						Made by{" "}
						<a
							href="https://x.com/sup_nim"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground hover:underline text-sky-500 "
						>
							@sup_nim
						</a>{" "}
						at{" "}
						<a
							href="https://studio.gold"
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground hover:underline text-sky-500 "
						>
							studio.gold
						</a>
					</p>
				</div>
			</CardContent>
		</Card>
	)
}
