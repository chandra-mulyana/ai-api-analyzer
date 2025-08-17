import { NextRequest, NextResponse } from "next/server";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompts";

// Helper to safely stringify objects (handles circular refs)
function safeStringify(obj: unknown) {
	try {
		return JSON.stringify(obj);
	} catch {
		return String(obj);
	}
}

// Helper to truncate long strings for prompt context
function truncate(input: string, max = 80_000) {
	if (input.length <= max) return input;
	const head = input.slice(0, Math.floor(max * 0.7));
	const tail = input.slice(-Math.floor(max * 0.3));
	return `${head}\n\n... [TRUNCATED ${
		input.length - max
	} chars] ...\n\n${tail}`;
}

export async function POST(req: NextRequest) {
	const startTime = Date.now();
	let latencyMs = 0;

	try {
		const {
			url,
			method = "GET",
			headers = {},
			body,
			instruction,
		} = await req.json();

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "GEMINI_API_KEY is not set" },
				{ status: 500 }
			);
		}

		if (!url || typeof url !== "string") {
			return NextResponse.json(
				{ error: "URL API wajib diisi" },
				{ status: 400 }
			);
		}

		const sanitizedHeaders = new Headers();
		Object.entries(headers || {}).forEach(([k, v]) => {
			if (
				typeof k === "string" &&
				typeof v === "string" &&
				!["authorization", "cookie"].includes(k.toLowerCase())
			) {
				sanitizedHeaders.set(k, v);
			}
		});

		const fetchOptions: RequestInit = { method, headers: sanitizedHeaders };
		if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && body) {
			fetchOptions.body =
				typeof body === "string" ? body : JSON.stringify(body);
			if (!sanitizedHeaders.has("content-type"))
				sanitizedHeaders.set("content-type", "application/json");
		}

		const res = await fetch(url, fetchOptions);
		const fetchEndTime = Date.now();
		latencyMs = fetchEndTime - startTime;

		const contentType = res.headers.get("content-type") || "";
		let raw: string;
		let parsed: unknown = null;

		if (contentType.includes("application/json")) {
			parsed = await res.json();
			raw = safeStringify(parsed);
		} else {
			raw = await res.text();
		}

		const statusInfo = {
			ok: res.ok,
			status: res.status,
			statusText: res.statusText,
			contentType,
		};

		// Panggil buildUserPrompt dari library
		const userPrompt = buildUserPrompt({
			instruction,
			statusInfo,
			rawDataSnippet: truncate(raw, 80_000),
		});

		// Gabungkan dengan SYSTEM_PROMPT dari library
		const prompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

		const geminiResponse = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
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
				}),
			}
		);

		if (!geminiResponse.ok) {
			const errorText = await geminiResponse.text();
			throw new Error(
				`Gemini API Error: ${geminiResponse.status} - ${errorText}`
			);
		}

		const geminiData = await geminiResponse.json();
		const analysis =
			geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

		return NextResponse.json({
			status: statusInfo,
			analysis: analysis.trim(),
			sample: parsed ?? raw,
			metrics: {
				latencyMs,
				tokensIn: 0,
				tokensOut: 0,
			},
		});
	} catch (err) {
		console.error(err);
		let errorMessage = "Terjadi kesalahan";
		if (err instanceof Error) {
			errorMessage = err.message;
		}
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
