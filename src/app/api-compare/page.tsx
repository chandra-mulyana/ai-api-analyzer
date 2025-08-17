"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Trash2, Zap, Globe, Diamond } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApiResponse {
	response: string;
	responseTime: number | null;
	error: string;
	loading: boolean;
}

export default function ApiComparisonPage() {
	const [prompt, setPrompt] = useState("");

	const [ollama, setOllama] = useState<ApiResponse>({
		response: "",
		responseTime: null,
		error: "",
		loading: false,
	});

	const [openroute, setOpenroute] = useState<ApiResponse>({
		response: "",
		responseTime: null,
		error: "",
		loading: false,
	});

	const [gemini, setGemini] = useState<ApiResponse>({
		response: "",
		responseTime: null,
		error: "",
		loading: false,
	});

	const callApi = async (apiType: "ollama" | "openroute" | "gemini") => {
		if (!prompt.trim()) return;

		const setApiState =
			apiType === "ollama"
				? setOllama
				: apiType === "openroute"
				? setOpenroute
				: setGemini;

		setApiState((prev) => ({
			...prev,
			loading: true,
			error: "",
			response: "",
			responseTime: null,
		}));

		const startTime = Date.now();

		try {
			const res = await fetch(`/api/${apiType}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ prompt: prompt.trim() }),
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const data = await res.json();
			const endTime = Date.now();
			const timeTaken = (endTime - startTime) / 1000;

			if (data.success) {
				setApiState((prev) => ({
					...prev,
					response: data.response,
					responseTime: timeTaken,
					loading: false,
				}));
			} else {
				setApiState((prev) => ({
					...prev,
					error: data.error || "Unknown error occurred",
					loading: false,
				}));
			}
		} catch (err) {
			setApiState((prev) => ({
				...prev,
				error:
					err instanceof Error
						? err.message
						: `Failed to connect to ${apiType}`,
				loading: false,
			}));
		}
	};

	const clearAll = () => {
		setPrompt("");
		setOllama({
			response: "",
			responseTime: null,
			error: "",
			loading: false,
		});
		setOpenroute({
			response: "",
			responseTime: null,
			error: "",
			loading: false,
		});
		setGemini({
			response: "",
			responseTime: null,
			error: "",
			loading: false,
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			// Call all APIs simultaneously
			Promise.all([
				callApi("ollama"),
				callApi("openroute"),
				callApi("gemini"),
			]);
		}
	};

	const getFastestTime = () => {
		const times = [
			ollama.responseTime,
			openroute.responseTime,
			gemini.responseTime,
		].filter((time) => time !== null) as number[];
		return times.length > 0 ? Math.min(...times) : null;
	};

	const isLoading = ollama.loading || openroute.loading || gemini.loading;

	return (
		<div className="container mx-auto p-6 max-w-6xl">
			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="h-5 w-5" />
						API Response Time Comparison
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Compare response times and quality across Ollama,
						OpenRoute, and Gemini APIs
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Input Section */}
					<div className="space-y-2">
						<Label htmlFor="prompt">Your Prompt</Label>
						<Input
							id="prompt"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="Enter your prompt here..."
							onKeyDown={handleKeyDown}
							disabled={isLoading}
							className="text-base"
						/>
						<p className="text-xs text-muted-foreground">
							Press Ctrl+Enter (Cmd+Enter on Mac) to call all APIs
							simultaneously
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={() => callApi("ollama")}
							disabled={isLoading || !prompt.trim()}
							className="flex items-center gap-2"
							variant="default"
						>
							{ollama.loading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Zap className="h-4 w-4" />
							)}
							Call Ollama
						</Button>

						<Button
							onClick={() => callApi("openroute")}
							disabled={isLoading || !prompt.trim()}
							className="flex items-center gap-2"
							variant="secondary"
						>
							{openroute.loading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Globe className="h-4 w-4" />
							)}
							Call OpenRoute
						</Button>

						<Button
							onClick={() => callApi("gemini")}
							disabled={isLoading || !prompt.trim()}
							className="flex items-center gap-2"
							variant="outline"
						>
							{gemini.loading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Diamond className="h-4 w-4" />
							)}
							Call Gemini
						</Button>

						<Button
							onClick={() => {
								Promise.all([
									callApi("ollama"),
									callApi("openroute"),
									callApi("gemini"),
								]);
							}}
							disabled={isLoading || !prompt.trim()}
							className="flex items-center gap-2"
							variant="destructive"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
							Call All APIs
						</Button>

						<Button
							variant="outline"
							onClick={clearAll}
							disabled={isLoading}
							className="flex items-center gap-2"
						>
							<Trash2 className="h-4 w-4" />
							Clear All
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* API Response Cards */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Ollama Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4" />
								Ollama
							</div>
							{ollama.responseTime && (
								<Badge
									variant={
										ollama.responseTime === getFastestTime()
											? "default"
											: "secondary"
									}
								>
									{ollama.responseTime.toFixed(2)}s
									{ollama.responseTime === getFastestTime() &&
										" 🚀"}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{ollama.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{ollama.error}
								</AlertDescription>
							</Alert>
						)}
						<Textarea
							value={ollama.response}
							readOnly
							placeholder="Ollama response will appear here..."
							className="min-h-[250px] font-mono text-sm"
						/>
						<div className="text-xs text-muted-foreground">
							{ollama.loading && "Generating response..."}
							{ollama.response && !ollama.loading && (
								<span>
									{ollama.response.length} characters
									{ollama.responseTime &&
										` • ${ollama.responseTime.toFixed(2)}s`}
								</span>
							)}
						</div>
					</CardContent>
				</Card>

				{/* OpenRoute Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Globe className="h-4 w-4" />
								OpenRoute
							</div>
							{openroute.responseTime && (
								<Badge
									variant={
										openroute.responseTime ===
										getFastestTime()
											? "default"
											: "secondary"
									}
								>
									{openroute.responseTime.toFixed(2)}s
									{openroute.responseTime ===
										getFastestTime() && " 🚀"}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{openroute.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{openroute.error}
								</AlertDescription>
							</Alert>
						)}
						<Textarea
							value={openroute.response}
							readOnly
							placeholder="OpenRoute response will appear here..."
							className="min-h-[250px] font-mono text-sm"
						/>
						<div className="text-xs text-muted-foreground">
							{openroute.loading && "Generating response..."}
							{openroute.response && !openroute.loading && (
								<span>
									{openroute.response.length} characters
									{openroute.responseTime &&
										` • ${openroute.responseTime.toFixed(
											2
										)}s`}
								</span>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Gemini Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Diamond className="h-4 w-4" />
								Gemini
							</div>
							{gemini.responseTime && (
								<Badge
									variant={
										gemini.responseTime === getFastestTime()
											? "default"
											: "secondary"
									}
								>
									{gemini.responseTime.toFixed(2)}s
									{gemini.responseTime === getFastestTime() &&
										" 🚀"}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{gemini.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{gemini.error}
								</AlertDescription>
							</Alert>
						)}
						<Textarea
							value={gemini.response}
							readOnly
							placeholder="Gemini response will appear here..."
							className="min-h-[250px] font-mono text-sm"
						/>
						<div className="text-xs text-muted-foreground">
							{gemini.loading && "Generating response..."}
							{gemini.response && !gemini.loading && (
								<span>
									{gemini.response.length} characters
									{gemini.responseTime &&
										` • ${gemini.responseTime.toFixed(2)}s`}
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Summary */}
			{(ollama.responseTime ||
				openroute.responseTime ||
				gemini.responseTime) && (
				<Card className="mt-6">
					<CardHeader>
						<CardTitle>Performance Summary</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{ollama.responseTime && (
								<div className="text-center p-4 border rounded">
									<div className="font-semibold">Ollama</div>
									<div className="text-2xl font-bold">
										{ollama.responseTime.toFixed(2)}s
									</div>
									<div className="text-sm text-muted-foreground">
										{ollama.response.length} chars
									</div>
								</div>
							)}
							{openroute.responseTime && (
								<div className="text-center p-4 border rounded">
									<div className="font-semibold">
										OpenRoute
									</div>
									<div className="text-2xl font-bold">
										{openroute.responseTime.toFixed(2)}s
									</div>
									<div className="text-sm text-muted-foreground">
										{openroute.response.length} chars
									</div>
								</div>
							)}
							{gemini.responseTime && (
								<div className="text-center p-4 border rounded">
									<div className="font-semibold">Gemini</div>
									<div className="text-2xl font-bold">
										{gemini.responseTime.toFixed(2)}s
									</div>
									<div className="text-sm text-muted-foreground">
										{gemini.response.length} chars
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
