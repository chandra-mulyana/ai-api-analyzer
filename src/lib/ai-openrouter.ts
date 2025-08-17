// lib/ai-openrouter.ts
import OpenAI from "openai";

export type OpenRouterOptions = {
	model?: string; // e.g. "openai/gpt-oss-20b:free"
	systemPrompt: string;
	userPrompt: string;
	temperature?: number;
	maxTokens?: number;
};

function getClient() {
	const apiKey = process.env.OPENROUTER_API_KEY!;
	const baseURL =
		process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

	if (!apiKey) throw new Error("OPENROUTER_API_KEY belum di-set");

	// Pakai OpenAI SDK tapi arahkan ke OpenRouter
	const client = new OpenAI({
		apiKey,
		baseURL,
	});

	return client;
}

export async function analyzeWithOpenRouter(opts: OpenRouterOptions) {
	const client = getClient();
	const model =
		opts.model || process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

	try {
		const res = await client.chat.completions.create(
			{
				model,
				messages: [
					{ role: "system", content: opts.systemPrompt },
					{ role: "user", content: opts.userPrompt },
				],
				temperature: opts.temperature ?? 0.2,
				max_tokens: opts.maxTokens ?? 1024,
			},
			{
				headers: {
					"HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
					"X-Title": process.env.OPENROUTER_SITE_NAME || "",
				},
			}
		);

		return res.choices[0]?.message?.content ?? "";
	} catch (err) {
		// propagasi error agar caller bisa fallback
		throw err;
	}
}
