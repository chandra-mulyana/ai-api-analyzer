// lib/ai.ts
import OpenAI from "openai";

type AIProvider = "openai" | "azure-openai";

const hasAzure =
	!!process.env.AZURE_OPENAI_ENDPOINT &&
	!!process.env.AZURE_OPENAI_API_KEY &&
	!!process.env.AZURE_OPENAI_DEPLOYMENT;

const provider: AIProvider = hasAzure ? "azure-openai" : "openai";

export async function analyzeWithAI({
	systemPrompt,
	userPrompt,
	model,
}: {
	systemPrompt: string;
	userPrompt: string;
	model?: string;
}) {
	if (provider === "azure-openai") {
		const client = new OpenAI({
			apiKey: process.env.AZURE_OPENAI_API_KEY!,
			baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
			defaultHeaders: {
				"api-key": process.env.AZURE_OPENAI_API_KEY!,
			},
		});

		const res = await client.chat.completions.create({
			// untuk Azure, model diabaikan dan pakai deployment, tapi tetap wajib diisi
			model: process.env.AZURE_OPENAI_DEPLOYMENT!,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.2,
		});

		return res.choices[0]?.message?.content ?? "";
	} else {
		const client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY!,
		});

		const usedModel = model || process.env.OPENAI_MODEL || "gpt-5-nano";

		const res = await client.chat.completions.create({
			model: usedModel,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.2,
		});

		return res.choices[0]?.message?.content ?? "";
	}
}
