import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { prompt } = await request.json();

		if (!prompt) {
			return NextResponse.json(
				{ success: false, error: "Prompt is required" },
				{ status: 400 }
			);
		}

		const ollamaResponse = await fetch(
			`${process.env.OLLAMA_BASE_URL}/api/generate`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: process.env.OLLAMA_MODEL,
					prompt: prompt,
					stream: false,
					options: {
						temperature: 0.7,
						max_tokens: 2048,
					},
				}),
			}
		);

		if (!ollamaResponse.ok) {
			const errorText = await ollamaResponse.text();
			throw new Error(
				`Ollama server error: ${ollamaResponse.status} - ${errorText}`
			);
		}

		const data = await ollamaResponse.json();

		return NextResponse.json({
			success: true,
			response: data.response,
		});
	} catch (error) {
		console.error("Ollama API error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
			},
			{ status: 500 }
		);
	}
}
