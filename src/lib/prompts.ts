// lib/prompts.ts

export const MARKDOWN_ANALYSIS_STYLE = `
# ATURAN FORMAT KELUARAN (WAJIB DIIKUTI)
- Bahasa: Indonesia.
- Format: Markdown saja (tanpa JSON kecuali pada blok kode).
- Gunakan heading, bullet, dan emoji.
- Gunakan *section* berikut secara berurutan (jangan tambah H1 di atas):
## 📊 Ringkasan
Tuliskan 3–6 poin kunci (angka penting: total, jumlah item, diskon, rata-rata, dsb).

## 🔍 Insight Penting
- Paparkan tren / kontributor utama / outlier (minimal 3 poin).
- Sebutkan alasan/interpretasi singkat.

## ✅ Rekomendasi
- 3–5 aksi spesifik dan dapat ditindaklanjuti.

## ⚠️ Catatan
- Cantumkan keterbatasan data (misal data terpotong/sampel kecil), kualitas data, asumsi.
- Jika API error, jelaskan kemungkinan penyebab & langkah perbaikan.

## 📎 Lampiran (Opsional)
- Jika data tabular, tampilkan *tabel Markdown* ringkas (mis. kolom: nama, qty, total, diskon).
- Jika perlu, tampilkan contoh record dalam blok kode \`\`\`json
`.trim();

export function buildUserPrompt(params: {
	instruction?: string;
	statusInfo: {
		ok: boolean;
		status: number;
		statusText: string;
		contentType: string;
	};
	rawDataSnippet: string;
}) {
	const { instruction, statusInfo, rawDataSnippet } = params;

	return `
Anda adalah analis data API. Analisislah respons API di bawah ini dan sajikan HASIL AKHIR sesuai "ATURAN FORMAT KELUARAN" yang diberikan.

Instruksi tambahan pengguna (opsional):
${instruction || "(tidak ada)"}

Metadata respons:
${JSON.stringify(statusInfo)}

Cuplikan data (dipangkas bila besar):
\`\`\`json
${rawDataSnippet}
\`\`\`

${MARKDOWN_ANALYSIS_STYLE}
`.trim();
}

export const SYSTEM_PROMPT = `
Anda adalah asisten analis API yang teliti, ringkas, dan rapi. 
- Keluaran WAJIB berupa Markdown (tanpa kalimat pembuka/penutup di luar struktur yang diminta).
- Jangan menyertakan catatan internal model.
- Jika data tidak lengkap/terpotong, nyatakan di bagian "⚠️ Catatan".
- Tetap faktual dan hindari spekulasi berlebihan.
`.trim();
