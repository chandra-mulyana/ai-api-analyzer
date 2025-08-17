# Aplikasi untuk analisa API menggunakan Ai

Menggunakan OpenRouter dan Gemini

## Tech Stack

-   Nextjs 15
-   Shadcn UI

## Cara :

Clone repo , lalu jalankan

```javascript
npm install
```

Buat file `.env` yang isinya :

```javascript
# --- OpenRouter ---
OPENROUTER_API_KEY=Diisi API KEY OpenRouter
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
# model default (gratis)
OPENROUTER_MODEL=openai/gpt-oss-20b:free

# opsional: untuk leaderboard OpenRouter (tidak wajib)
OPENROUTER_SITE_URL=https://localhost:3000
OPENROUTER_SITE_NAME=AI API Analyzer (Dev)

# --- Gemini ---
GEMINI_API_KEY=Diisi API KEY Gemini
```

## OpenRouter

Link nya : https://openrouter.ai/

<p>Silahkan login kemudian masuk ke menu Keys, dan buat API Keys nya</br>
Nanti bisa pilih juga model yang gratis.</p>

## Gemini

Link nya : https://aistudio.google.com/apikey

<p>Silahkan buat API Keys</br>
Untuk Gemini versi gratis ada limitasi nya, silahkan akses ke :</p>

https://ai.google.dev/gemini-api/docs/rate-limits
