// app/api/analyze/route.ts (potongan yang relevan)
import { NextRequest, NextResponse } from "next/server";
import { analyzeWithOpenRouter } from "@/lib/ai-openrouter";
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

// ... kode fetch API target tetap sama (statusInfo, raw, truncate, dsb)
// asumsikan variabel: statusInfo, rawDataSnippet, instruction sudah tersedia

export async function POST(req: NextRequest) {
	try {
		const {
			url,
			method = "GET",
			headers = {},
			body,
			instruction,
			model,
		} = await req.json();

		// Validasi URL
		if (!url || typeof url !== "string") {
			return NextResponse.json(
				{ error: "URL API wajib diisi" },
				{ status: 400 }
			);
		}

		// Sanitasi header dari client
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

		// Panggil API target
		const res = await fetch(url, fetchOptions);
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

		const userPrompt = buildUserPrompt({
			instruction,
			statusInfo,
			rawDataSnippet: truncate(raw, 80_000),
		});

		let analysis: string | null = null;

		// 1) Coba dengan model pilihan user (jika ada) atau env
		try {
			analysis = await analyzeWithOpenRouter({
				systemPrompt: SYSTEM_PROMPT,
				userPrompt,
				model: model || process.env.OPENROUTER_MODEL, // bisa override dari UI
				temperature: 0.2,
			});
		} catch (e1) {
			// 2) Fallback otomatis ke model gratis
			try {
				analysis = await analyzeWithOpenRouter({
					systemPrompt: SYSTEM_PROMPT,
					userPrompt,
					model: "openai/gpt-oss-20b:free",
					temperature: 0.2,
				});
			} catch {
				throw e1; // lempar error awal supaya user tahu penyebab
			}
		}

		return NextResponse.json({
			status: statusInfo,
			analysis: (analysis || "").trim(),
			// sample: parsed ?? raw.slice(0, 2000),
			sample: parsed ?? raw,
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
