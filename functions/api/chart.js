export async function onRequestPost({ request, env }) {
  try {
    const { userId, content, fileUrl } = await request.json();

    if (!userId || !content) {
      return new Response(JSON.stringify({ error: "Missing userId or content" }), { status: 400 });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;
    const ACCOUNT_ID = env.ACCOUNT_ID;
    const MODEL = "@cf/meta/llama-3.1-8b-instruct"; // Updated

    console.log("Worker started for user:", userId);

    // --- Helper ---
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

    // --- 1. Save USER message ---
    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content,
      sender: "user",
      is_auto: false,
      file_url: fileUrl || null,
    });
    console.log("User message saved");

    // --- 2. Extract topic ---
    const userTopic = content.match(/\[Topic: ([^\]]+)\]/)?.[1]?.toLowerCase() || "general";

    // --- 3. Get history ---
    const history = await supabaseFetch(
      "messages",
      "GET",
      null,
      `?user_id=eq.${userId}&order=created_at.asc&limit=6`
    );

    // --- 4. Get knowledge + templates ---
    const knowledge = await supabaseFetch(
      "knowledge",
      "GET",
      null,
      `?or=(topic.ilike.%25${userTopic}%25,topic.ilike.%25general%25)&order=priority.desc&limit=4`
    );

    const templates = await supabaseFetch(
      "templates",
      "GET",
      null,
      `?category=ilike.%25${userTopic}%25&limit=3`
    );

    // --- 5. Build prompt ---
    const chat = (history || []).map(m => 
      `${m.sender === "user" ? "User" : "Agent"}: ${m.content.replace(/\[Topic:[^\]]+\]\s*/g, '')}`
    ).join("\n");

    const faqs = (knowledge || []).map(k => `• ${k.content}`).join("\n");
    const tmpl = templates.length > 0
      ? `Available Templates:\n${templates.map(t => 
          `- ${t.name}: $${t.price_usd} | ${t.description}`
        ).join("\n")}`
      : "No templates available.";

    const prompt = `
You are a friendly, expert support agent for Neodynix Technologies.
We sell customizable website templates.

Use this info:
${faqs}

${tmpl}

Recent chat:
${chat}

Current user message: ${content}

Respond in 1-2 short sentences. Be warm, clear, and helpful. End with a question or next step.`;

    // --- 6. Call AI ---
    let aiText = "Thanks! Our team will get back to you soon.";
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

      if (!aiRes.ok) {
        const err = await aiRes.text();
        console.error("AI API error:", err);
        throw new Error("AI failed");
      }

      const aiData = await aiRes.json();
      aiText = (aiData?.result?.response || aiText).trim();
      console.log("AI response:", aiText);
    } catch (err) {
      console.error("AI call failed:", err);
      // Still proceed to save fallback
    }

    // --- 7. Save AI reply ---
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
    console.error("Worker crashed:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
                                     }
