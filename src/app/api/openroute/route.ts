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

		// Replace with your OpenRoute API endpoint and key
		const openrouteResponse = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
					"HTTP-Referer":
						process.env.NEXT_PUBLIC_SITE_URL ||
						"http://localhost:3000",
					"X-Title": "API Comparison Tool",
				},
				body: JSON.stringify({
					model: process.env.OPENROUTER_MODEL, // or your preferred model
					messages: [
						{
							role: "user",
							content: prompt,
						},
					],
					max_tokens: 2048,
					temperature: 0.7,
				}),
			}
		);

		if (!openrouteResponse.ok) {
			const errorText = await openrouteResponse.text();
			throw new Error(
				`OpenRoute API error: ${openrouteResponse.status} - ${errorText}`
			);
		}

		const data = await openrouteResponse.json();

		return NextResponse.json({
			success: true,
			response:
				data.choices[0]?.message?.content || "No response received",
		});
	} catch (error) {
		console.error("OpenRoute API error:", error);
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
