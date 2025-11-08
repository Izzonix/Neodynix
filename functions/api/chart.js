export async function onRequestPost({ request, env }) {
  // FIX #7: Add CORS headers for debugging
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { userId, content, fileUrl } = body;
    
    console.log('Received request:', { userId, content, fileUrl });
    
    if (!userId || !content) {
      return new Response(JSON.stringify({ error: "Missing userId or content" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // FIX #8: Verify environment variables exist
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;
    const ACCOUNT_ID = env.ACCOUNT_ID;
    const AI_KEY = env.AI_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY || !ACCOUNT_ID || !AI_KEY) {
      console.error('Missing environment variables:', {
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_KEY: !!SUPABASE_KEY,
        ACCOUNT_ID: !!ACCOUNT_ID,
        AI_KEY: !!AI_KEY
      });
      throw new Error('Server configuration error');
    }

    const MODEL = "@cf/meta/llama-3.1-8b-instruct";

    async function supabaseFetch(table, method = "GET", body = null, query = "") {
      const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
      console.log(`Supabase ${method} to:`, url);
      
      const res = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation" // FIX #9: Get inserted data back
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const responseText = await res.text();
      console.log(`Supabase response (${res.status}):`, responseText);
      
      if (!res.ok) {
        console.error(`Supabase ${method} ${table} failed:`, responseText);
        throw new Error(`Supabase error: ${res.status} - ${responseText}`);
      }
      
      return responseText ? JSON.parse(responseText) : null;
    }

    // Save user message
    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content,
      sender: "user",
      is_auto: false,
      file_url: fileUrl || null,
    });
    console.log("✓ User message saved");

    // Extract topic
    const userTopic = content.match(/\[Topic: ([^\]]+)\]/)?.[1]?.toLowerCase() || "general";
    console.log("Topic extracted:", userTopic);

    // Get conversation history
    const history = await supabaseFetch(
      "messages",
      "GET",
      null,
      `?user_id=eq.${userId}&order=created_at.desc&limit=6`
    );
    console.log("✓ History fetched:", history?.length || 0);

    // FIX #10: Better query encoding for Supabase
    const topicEncoded = encodeURIComponent(userTopic);
    
    // Get knowledge base
    const knowledge = await supabaseFetch(
      "knowledge",
      "GET",
      null,
      `?or=(topic.ilike.*${topicEncoded}*,topic.ilike.*general*)&order=priority.desc&limit=4`
    );
    console.log("✓ Knowledge fetched:", knowledge?.length || 0);

    // Get templates
    const templates = await supabaseFetch(
      "templates",
      "GET",
      null,
      `?category=ilike.*${topicEncoded}*&limit=3`
    );
    console.log("✓ Templates fetched:", templates?.length || 0);

    // Build conversation context
    const chat = (history || [])
      .reverse() // Show oldest first
      .map(m => 
        `${m.sender === "user" ? "User" : "Agent"}: ${m.content.replace(/\[Topic:[^\]]+\]\s*/g, '')}`
      )
      .join("\n");

    const faqs = (knowledge || []).map(k => `• ${k.content}`).join("\n") || "No FAQs available.";
    const tmpl = templates && templates.length > 0
      ? `Available Templates:\n${templates.map(t => `- ${t.name}: $${t.price_usd} - ${t.description}`).join("\n")}`
      : "No templates match this topic.";

    const prompt = `You are a friendly support agent for Neodynix Technologies, a company that sells website templates.

Knowledge Base:
${faqs}

${tmpl}

Recent Conversation:
${chat}

Current User Message: ${content.replace(/\[Topic:[^\]]+\]\s*/g, '')}

Instructions: Respond in 1-2 short, helpful sentences. Be warm and conversational. If relevant, mention specific templates by name. End with a question or suggested next step.`;

    console.log("Prompt created, length:", prompt.length);

    // Call Cloudflare AI
    let aiText = "Thanks for reaching out! Our team will respond shortly.";
    try {
      console.log("Calling Cloudflare AI...");
      const aiRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a concise, friendly support agent for Neodynix Technologies." },
              { role: "user", content: prompt }
            ],
            max_tokens: 200
          }),
        }
      );

      const aiResponseText = await aiRes.text();
      console.log("AI raw response:", aiResponseText);

      if (!aiRes.ok) {
        console.error("AI API error:", aiResponseText);
        throw new Error(`AI API error: ${aiRes.status}`);
      }

      const aiData = JSON.parse(aiResponseText);
      console.log("AI parsed data:", aiData);
      
      // FIX #11: Handle different response formats
      aiText = aiData?.result?.response || aiData?.response || aiText;
      aiText = aiText.trim();
      
      console.log("✓ AI reply:", aiText);
    } catch (err) {
      console.error("AI failed:", err.message);
      // Fallback message already set
    }

    // Save AI response
    await supabaseFetch("messages", "POST", {
      user_id: userId,
      content: aiText,
      sender: "support",
      is_auto: true,
    });
    console.log("✓ AI reply saved");

    return new Response(JSON.stringify({ success: true, reply: aiText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ 
      error: "Server error", 
      details: err.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}                                 
