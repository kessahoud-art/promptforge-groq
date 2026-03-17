// api/claude.js
// Fonction Vercel — utilise Groq API (100% gratuit, ultra rapide)
// Clé cachée côté serveur, invisible pour les utilisateurs

export default async function handler(req, res) {

  // CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Clé Groq depuis variable d'environnement Vercel
  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: "Clé API non configurée. Va dans Vercel → Settings → Environment Variables et ajoute GROQ_API_KEY."
    });
  }

  try {
    const { system, messages } = req.body;
    const userMessage = messages?.[0]?.content || "";

    // Appel à l'API Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.9,
        max_tokens: 2000,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Erreur Groq API"
      });
    }

    // Reformate au format attendu par l'app
    const text = data.choices?.[0]?.message?.content || "";

    return res.status(200).json({
      content: [{ type: "text", text }]
    });

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
}
