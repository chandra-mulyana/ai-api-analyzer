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

		// Replace with your Gemini API endpoint and key
		const geminiResponse = await fetch(
			// `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: prompt,
								},
							],
						},
					],
					// generationConfig: {
					// 	temperature: 0.7,
					// 	maxOutputTokens: 2048,
					// },
				}),
			}
		);

		if (!geminiResponse.ok) {
			const errorText = await geminiResponse.text();
			throw new Error(
				`Gemini API error: ${geminiResponse.status} - ${errorText}`
			);
		}

		const data = await geminiResponse.json();

		return NextResponse.json({
			success: true,
			response:
				data.candidates[0]?.content?.parts[0]?.text ||
				"No response received",
		});
	} catch (error) {
		console.error("Gemini API error:", error);
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
