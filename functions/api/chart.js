export async function onRequestPost({ request, env }) {
  try {
    const { userId, content, fileUrl } = await request.json();

    if (!userId || !content) {
      return new Response(JSON.stringify({ error: "Missing userId or content" }), { status: 400 });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;
    const ACCOUNT_ID = env.ACCOUNT_ID; // ✅ use environment variable
    const MODEL = "@cf/meta/llama-3-8b-instruct";

    // --- Helper for Supabase REST calls ---
    async function supabaseFetch(table, method = "GET", body = null, query = "") {
      const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
      const res = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) console.error(`Supabase error: ${res.statusText}`);
      return res.json();
    }

    // --- 1. Save user message ---
    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content,
      sender: "user",
      is_auto: false,
      file_url: fileUrl || null,
    });

    // --- 2. Extract topic ---
    const userTopic = content.match(/\[Topic: ([^\]]+)\]/)?.[1]?.toLowerCase() || "general";

    // --- 3. Retrieve message history ---
    const history = await supabaseFetch(
      "messages",
      "GET",
      null,
      `?user_id=eq.${userId}&order=created_at.asc&limit=8`
    );

    // --- 4. Retrieve knowledge and templates ---
    const knowledge = await supabaseFetch(
      "knowledge",
      "GET",
      null,
      `?or=(topic.ilike.%25${userTopic}%25,topic.ilike.%25general%25)&order=priority.asc&limit=5`
    );

    const templates = await supabaseFetch(
      "templates",
      "GET",
      null,
      `?category=ilike.%25${userTopic}%25&limit=3`
    );

    // --- 5. Build prompt ---
    const chat = (history || [])
      .map(m => `${m.sender === "user" ? "User" : "Agent"}: ${m.content}`)
      .join("\n");
    const faqs = (knowledge || [])
      .map(k => `FAQ: ${k.content}`)
      .join("\n\n");
    const tmpl = templates.length
      ? `Templates:\n${templates.map(
          t => `- ${t.name} (${t.category}): $${t.price_usd} USD | ${t.price_ugx} UGX | ${t.price_ksh} KES | ${t.price_tsh} TSH\n  Description: ${t.description}`
        ).join("\n")}`
      : "No matching templates found.";

    const prompt = `
You are a friendly, expert support agent for Neodynix Technologies.

Business:
- We sell pre-built, customizable website templates.

Use this data:
${faqs}

${tmpl}

Chat so far:
${chat}

User: ${content}

Assistant (max 120 words, warm tone, clear, and end with a helpful next step):`;

    // --- 6. Cloudflare AI API call ---
    let aiText = "Thanks! Our team will reply soon.";
    try {
      const aiRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.AI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a helpful customer support assistant." },
              { role: "user", content: prompt },
            ],
          }),
        }
      );

      const aiData = await aiRes.json();
      aiText = aiData?.result?.response || aiText;
    } catch (err) {
      console.error("AI fetch error:", err);
    }

    // --- 7. Save AI reply ---
    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content: aiText,
      sender: "support",
      is_auto: true,
    });

    return new Response(JSON.stringify({ success: true, reply: aiText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
