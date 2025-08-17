"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type AnalyzeResponse = {
	status: {
		ok: boolean;
		status: number;
		statusText: string;
		contentType: string;
	};
	analysis: string;
	sample: unknown;
	error?: string;
	metrics?: {
		latencyMs?: number;
		tokensIn?: number;
		tokensOut?: number;
	};
};

const parseAnalysis = (markdownText: string) => {
	const sections = {
		ringkasan: "",
		insight: "",
		rekomendasi: "",
		catatan: "",
		lampiran: "",
	};

	const ringkasanMatch = markdownText.match(
		/## 📊 Ringkasan\s*([\s\S]*?)(?=\n## 🔍 Insight Penting|$)/
	);
	const insightMatch = markdownText.match(
		/## 🔍 Insight Penting\s*([\s\S]*?)(?=\n## ✅ Rekomendasi|$)/
	);
	const rekomendasiMatch = markdownText.match(
		/## ✅ Rekomendasi\s*([\s\S]*?)(?=\n## ⚠️ Catatan|$)/
	);
	const catatanMatch = markdownText.match(
		/## ⚠️ Catatan\s*([\s\S]*?)(?=\n## 📎 Lampiran \(Opsional\)|$)/
	);
	const lampiranMatch = markdownText.match(
		/## 📎 Lampiran \(Opsional\)\s*([\s\S]*)/
	);

	if (ringkasanMatch) sections.ringkasan = ringkasanMatch[1].trim();
	if (insightMatch) sections.insight = insightMatch[1].trim();
	if (rekomendasiMatch) sections.rekomendasi = rekomendasiMatch[1].trim();
	if (catatanMatch) sections.catatan = catatanMatch[1].trim();
	if (lampiranMatch) sections.lampiran = lampiranMatch[1].trim();

	if (
		!sections.ringkasan &&
		!sections.insight &&
		!sections.rekomendasi &&
		!sections.catatan &&
		!sections.lampiran
	) {
		sections.ringkasan = markdownText;
	}

	return sections;
};

export default function Home() {
	const [url, setUrl] = useState("https://dummyjson.com/carts/1");
	const [instruction, setInstruction] = useState(
		"Fokus pada metrik penjualan, item kontributor utama, dan rekomendasi promosi."
	);
	const [loadingOpenrouter, setLoadingOpenrouter] = useState(false);
	const [loadingGemini, setLoadingGemini] = useState(false);
	const [res, setRes] = useState<AnalyzeResponse | null>(null);
	const [errMsg, setErrMsg] = useState<string | null>(null);

	const handleAnalyze = async (
		apiEndpoint: string,
		setLoading: (state: boolean) => void
	) => {
		setLoading(true);
		setErrMsg(null);
		setRes(null);

		try {
			const r = await fetch(apiEndpoint, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					url,
					method: "GET", // Tetapkan ke GET karena tidak ada lagi kontrol untuk method
					headers: {}, // Tidak ada lagi kontrol header
					body: undefined, // Tidak ada lagi kontrol body
					instruction,
				}),
			});
			const j = await r.json();
			if (!r.ok) setErrMsg(j.error || "Gagal menganalisis");
			else setRes(j);
		} catch (e) {
			if (e instanceof Error) {
				setErrMsg(e.message);
			} else {
				setErrMsg("An unexpected error occurred");
			}
		} finally {
			setLoading(false);
		}
	};

	const onSubmitOpenrouter = () =>
		handleAnalyze("/api/analyze", setLoadingOpenrouter);
	const onSubmitGemini = () =>
		handleAnalyze("/api/gemini-analyze", setLoadingGemini);

	return (
		<main className="w-full h-screen p-6">
			<Card>
				<CardHeader>
					<CardTitle>🔎 API → AI Analyzer (Markdown)</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3">
						<Label>Endpoint URL</Label>
						<Input
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://api.example.com/data"
						/>
					</div>

					<div className="grid gap-2">
						<Label>Instruksi Analisis (opsional)</Label>
						<Input
							value={instruction}
							onChange={(e) => setInstruction(e.target.value)}
							placeholder="Mis: cari anomali, metrik penting, rekomendasi."
						/>
					</div>

					<div className="flex space-x-2">
						<Button
							onClick={onSubmitOpenrouter}
							disabled={loadingOpenrouter}
						>
							{loadingOpenrouter
								? "Memproses..."
								: "Analisis dengan Openrouter"}
						</Button>
						<Button
							onClick={onSubmitGemini}
							disabled={loadingGemini}
						>
							{loadingGemini
								? "Memproses..."
								: "Analisis dengan Gemini"}
						</Button>
					</div>

					{errMsg && (
						<div className="text-red-600 text-sm">{errMsg}</div>
					)}

					{res && (
						<>
							<Separator className="my-4" />
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="md:col-span-1">
									<Card>
										<CardHeader>
											<CardTitle>
												Status & Sample Data
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-2">
											<div className="text-sm">
												<b>Status:</b>{" "}
												{res.status.status}{" "}
												{res.status.statusText} |{" "}
												{res.status.contentType}
											</div>
											{res.metrics && (
												<div className="text-sm">
													<b>Waktu Latensi:</b>{" "}
													{res.metrics.latencyMs} ms |{" "}
													<b>Tokens In:</b>{" "}
													{res.metrics.tokensIn} |{" "}
													<b>Tokens Out:</b>{" "}
													{res.metrics.tokensOut}
												</div>
											)}
											<ScrollArea className="h-[50vh] pr-2">
												<pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
													{typeof res.sample ===
													"string"
														? res.sample
														: JSON.stringify(
																res.sample,
																null,
																2
														  )}
												</pre>
											</ScrollArea>
										</CardContent>
									</Card>
								</div>

								<div className="md:col-span-3">
									<Card>
										<CardHeader>
											<CardTitle>
												Hasil Analisis
											</CardTitle>
										</CardHeader>
										<CardContent>
											{res.analysis &&
												(() => {
													const parts = parseAnalysis(
														res.analysis
													);

													if (
														parts.ringkasan ===
														res.analysis
													) {
														return (
															<ScrollArea className="h-[50vh] pr-2">
																<article className="prose prose-sm max-w-none dark:prose-invert">
																	<ReactMarkdown
																		remarkPlugins={[
																			remarkGfm,
																		]}
																	>
																		{
																			res.analysis
																		}
																	</ReactMarkdown>
																</article>
															</ScrollArea>
														);
													}

													return (
														<ScrollArea className="h-[56vh] pr-2">
															<div className="space-y-4">
																{parts.ringkasan && (
																	<Card className="bg-blue-50 dark:bg-blue-950">
																		<CardHeader>
																			<CardTitle>
																				📊
																				Ringkasan
																			</CardTitle>
																		</CardHeader>
																		<CardContent>
																			<article className="prose prose-sm max-w-none dark:prose-invert">
																				<ReactMarkdown
																					remarkPlugins={[
																						remarkGfm,
																					]}
																				>
																					{
																						parts.ringkasan
																					}
																				</ReactMarkdown>
																			</article>
																		</CardContent>
																	</Card>
																)}

																{parts.insight && (
																	<Card className="bg-green-50 dark:bg-green-950">
																		<CardHeader>
																			<CardTitle>
																				🔍
																				Insight
																				Penting
																			</CardTitle>
																		</CardHeader>
																		<CardContent>
																			<article className="prose prose-sm max-w-none dark:prose-invert">
																				<ReactMarkdown
																					remarkPlugins={[
																						remarkGfm,
																					]}
																				>
																					{
																						parts.insight
																					}
																				</ReactMarkdown>
																			</article>
																		</CardContent>
																	</Card>
																)}

																{parts.rekomendasi && (
																	<Card className="bg-yellow-50 dark:bg-yellow-950">
																		<CardHeader>
																			<CardTitle>
																				✅
																				Rekomendasi
																			</CardTitle>
																		</CardHeader>
																		<CardContent>
																			<article className="prose prose-sm max-w-none dark:prose-invert">
																				<ReactMarkdown
																					remarkPlugins={[
																						remarkGfm,
																					]}
																				>
																					{
																						parts.rekomendasi
																					}
																				</ReactMarkdown>
																			</article>
																		</CardContent>
																	</Card>
																)}

																{parts.catatan && (
																	<Card className="bg-orange-50 dark:bg-orange-950">
																		<CardHeader>
																			<CardTitle>
																				⚠️
																				Catatan
																			</CardTitle>
																		</CardHeader>
																		<CardContent>
																			<article className="prose prose-sm max-w-none dark:prose-invert">
																				<ReactMarkdown
																					remarkPlugins={[
																						remarkGfm,
																					]}
																				>
																					{
																						parts.catatan
																					}
																				</ReactMarkdown>
																			</article>
																		</CardContent>
																	</Card>
																)}

																{parts.lampiran && (
																	<Card className="bg-purple-50 dark:bg-purple-950">
																		<CardHeader>
																			<CardTitle>
																				📎
																				Lampiran
																				(Opsional)
																			</CardTitle>
																		</CardHeader>
																		<CardContent>
																			<article className="prose prose-sm max-w-none dark:prose-invert">
																				<ReactMarkdown
																					remarkPlugins={[
																						remarkGfm,
																					]}
																				>
																					{
																						parts.lampiran
																					}
																				</ReactMarkdown>
																			</article>
																		</CardContent>
																	</Card>
																)}
															</div>
														</ScrollArea>
													);
												})()}
										</CardContent>
									</Card>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
