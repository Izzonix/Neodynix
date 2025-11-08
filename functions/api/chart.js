export async function onRequestPost({ request, env }) {
  try {
    const { userId, content, fileUrl } = await request.json();
    if (!userId || !content) {
      return new Response(JSON.stringify({ error: "Missing userId or content" }), { status: 400 });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;
    const ACCOUNT_ID = env.ACCOUNT_ID;
    const MODEL = "@cf/meta/llama-3.1-8b-instruct";

    console.log("Worker: Processing message for user:", userId);

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
      if (!res.ok) {
        const err = await res.text();
        console.error(`Supabase ${method} ${table} failed:`, err);
        throw new Error(`Supabase error: ${res.status}`);
      }
      return res.json();
    }

    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content,
      sender: "user",
      is_auto: false,
      file_url: fileUrl || null,
    });
    console.log("User message saved");

    const userTopic = content.match(/\[Topic: ([^\]]+)\]/)?.[1]?.toLowerCase() || "general";

    const history = await supabaseFetch(
      "messages",
      "GET",
      null,
      `?user_id=eq.${userId}&order=created_at.asc&limit=6`
    );

    const knowledge = await supabaseFetch(
      "knowledge",
      "GET",
      null,
      `?or=(topic.ilike.%${userTopic}%,topic.ilike.%general%)&order=priority.desc&limit=4`
    );

    const templates = await supabaseFetch(
      "templates",
      "GET",
      null,
      `?category=ilike.%${userTopic}%&limit=3`
    );

    const chat = (history || []).map(m => 
      `${m.sender === "user" ? "User" : "Agent"}: ${m.content.replace(/\[Topic:[^\]]+\]\s*/g, '')}`
    ).join("\n");

    const faqs = (knowledge || []).map(k => `• ${k.content}`).join("\n") || "No FAQs.";
    const tmpl = templates.length > 0
      ? `Templates:\n${templates.map(t => `- ${t.name}: $${t.price_usd} | ${t.description}`).join("\n")}`
      : "No templates.";

    const prompt = `
You are a friendly support agent for Neodynix Technologies (we sell website templates).

Use:
${faqs}

${tmpl}

Chat:
${chat}

User: ${content}

Respond in 1-2 short sentences. Be warm and helpful. End with a question or next step.`;

    let aiText = "Thanks! Our team will reply soon.";
    try {
      console.log("Calling Cloudflare AI...");
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
              { role: "system", content: "You are a concise, friendly support agent." },
              { role: "user", content: prompt }
            ],
            max_tokens: 150
          }),
        }
      );

      if (!aiRes.ok) throw new Error(await aiRes.text());
      const aiData = await aiRes.json();
      aiText = (aiData?.result?.response || aiText).trim();
      console.log("AI reply:", aiText);
    } catch (err) {
      console.error("AI failed:", err);
    }

    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content: aiText,
      sender: "support",
      is_auto: true,
    });
    console.log("AI reply saved");

    return new Response(JSON.stringify({ success: true, reply: aiText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
