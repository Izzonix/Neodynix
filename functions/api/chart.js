export async function onRequestPost({ request, env }) {
  try {
    const { userId, content, fileUrl } = await request.json();

    if (!userId || !content) {
      return new Response(JSON.stringify({ error: "Missing userId or content" }), { status: 400 });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;

    // Helper for Supabase REST calls
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
      return res.json();
    }

    // Save user message
    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content,
      sender: "user",
      is_auto: false,
      file_url: fileUrl || null,
    });

    // Extract topic
    const userTopic = content.match(/\[Topic: ([^\]]+)\]/)?.[1]?.toLowerCase() || "general";

    // Last 8 messages
    const history = await supabaseFetch(
      "messages",
      "GET",
      null,
      `?user_id=eq.${userId}&order=created_at.asc&limit=8`
    );

    // Knowledge
    const knowledge = await supabaseFetch(
      "knowledge",
      "GET",
      null,
      `?or=(topic.ilike.%25${userTopic}%25,topic.ilike.%25general%25)&order=priority.asc&limit=5`
    );

    // Templates
    const templates = await supabaseFetch(
      "templates",
      "GET",
      null,
      `?category=ilike.%25${userTopic}%25&limit=3`
    );

    // Build conversation & knowledge
    const chat = (history || []).map(m => `${m.sender === "user" ? "User" : "Agent"}: ${m.content}`).join("\n");
    const faqs = (knowledge || []).map(k => `FAQ: ${k.content}`).join("\n\n");
    const tmpl = templates.length
      ? `Templates:\n${templates.map(t => `- ${t.name} (${t.category}): $${t.price_usd} USD | ${t.price_ugx} UGX | ${t.price_ksh} KES | ${t.price_tsh} TSH\n  Description: ${t.description}`).join("\n")}`
      : "No matching templates.";

    // Cloudflare AI call
    const prompt = `
You are a friendly, expert support agent for Neodynix Technologies.

Business:
- We sell pre-built, customizable website templates.

Use this data:
${faqs}

${tmpl}

Chat:
${chat}

User: ${content}

Assistant (max 120 words, warm, clear, and end with an action):`;

    let aiText = "Thanks! Our team will reply soon.";
    try {
      const aiRes = await fetch("https://api.cloudflare.com/client/v4/accounts/b9bb9fa97040508999fbb56b7974171c/ai/llama-3-8b-instruct", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.AI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, max_tokens: 150 }),
      });
      const aiData = await aiRes.json();
      if (aiData?.result) aiText = aiData.result;
    } catch (err) {
      console.error("AI error:", err);
    }

    // Save AI reply
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
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
                                     }
