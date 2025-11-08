// Tell Cloudflare which modules are external
export const config = {
  external: ["@cloudflare/ai", "@supabase/supabase-js"]
};

import { Ai } from "@cloudflare/ai";
import { createClient } from "@supabase/supabase-js";

export async function onRequestPost(context) {
  const { env, request } = context;

  // Initialize Cloudflare AI
  const ai = new Ai(env.AI);

  // Initialize Supabase client with service key
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    const { userId, content, fileUrl } = await request.json();

    if (!userId || !content) {
      return new Response(JSON.stringify({ error: "Missing userId or content" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Save user message
    await supabase.from("messages").insert({
      user_id: userId,
      content,
      sender: "user",
      is_auto: false,
      file_url: fileUrl || null,
    });

    // Extract topic from message
    const userTopic = content.match(/\[Topic: ([^\]]+)\]/)?.[1]?.toLowerCase() || "general";

    // Get last 8 messages for context
    const { data: history } = await supabase
      .from("messages")
      .select("content,sender")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(8);

    // Fetch related knowledge
    const { data: knowledge } = await supabase
      .from("knowledge")
      .select("content")
      .or(`topic.ilike.%${userTopic}%,topic.ilike.%general%`)
      .order("priority", { ascending: false })
      .limit(5);

    // Fetch relevant templates
    const { data: templates } = await supabase
      .from("templates")
      .select("name,category,price_usd,price_ugx,price_ksh,price_tsh,description")
      .ilike("category", `%${userTopic}%`)
      .limit(3);

    // Build conversation history string
    const chat = (history || [])
      .map(m => `${m.sender === "user" ? "User" : "Agent"}: ${m.content}`)
      .join("\n");

    // Build FAQ knowledge string
    const faqs = (knowledge || []).map(k => `FAQ: ${k.content}`).join("\n\n");

    // Build template info string
    const tmpl = templates && templates.length > 0
      ? `Templates:\n${templates.map(t =>
          `- ${t.name} (${t.category}): $${t.price_usd} USD | ${t.price_ugx} UGX | ${t.price_ksh} KES | ${t.price_tsh} TSH\n  Description: ${t.description}`
        ).join("\n")}`
      : "No matching templates.";

    // Construct AI prompt
    const prompt = `
You are a friendly support agent for Neodynix Technologies.

Business:
- Pre-built, customizable website templates.
- Customer fills form → template customization → launch.

Use this data:
${faqs}

${tmpl}

Chat history:
${chat}

User: ${content}

Assistant (max 120 words, warm, clear, end with an action):`;

    // Call Cloudflare AI model
    let aiText;
    try {
      const result = await ai.run("@cf/meta/llama-3-8b-instruct", {
        prompt,
        max_tokens: 150,
      });
      aiText = result.response;
    } catch (aiError) {
      console.error("AI error:", aiError);
      aiText = null;
    }

    const reply = (aiText || "Thanks! Our team will reply soon.").trim();

    // Save AI reply
    await supabase.from("messages").insert({
      user_id: userId,
      content: reply,
      sender: "support",
      is_auto: true,
    });

    return new Response(JSON.stringify({ success: true, reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
        }
