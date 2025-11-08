export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { userId, content, fileUrl } = body;
    
    console.log('📥 Received request:', { userId, content: content?.substring(0, 50) });
    
    if (!userId || !content) {
      return new Response(JSON.stringify({ 
        error: "Missing userId or content",
        received: { userId: !!userId, content: !!content }
      }), { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify environment variables
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;
    const ACCOUNT_ID = env.ACCOUNT_ID;
    const AI_KEY = env.AI_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY || !ACCOUNT_ID || !AI_KEY) {
      console.error('❌ Missing env vars:', {
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_KEY: !!SUPABASE_KEY,
        ACCOUNT_ID: !!ACCOUNT_ID,
        AI_KEY: !!AI_KEY
      });
      return new Response(JSON.stringify({ 
        error: 'Server configuration error' 
      }), { 
        status: 500,
        headers: corsHeaders
      });
    }

    const MODEL = "@cf/meta/llama-3.1-8b-instruct";

    // Supabase helper function
    async function supabaseFetch(table, method = "GET", body = null, query = "") {
      const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
      
      const res = await fetch(url, {
        method,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": method === "POST" ? "return=representation" : "return=minimal"
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const responseText = await res.text();
      
      if (!res.ok) {
        console.error(`❌ Supabase ${method} ${table} failed (${res.status}):`, responseText);
        throw new Error(`Supabase error: ${res.status}`);
      }
      
      return responseText ? JSON.parse(responseText) : null;
    }

    // 1. Save user message to database
    console.log('💾 Saving user message...');
    const userMessage = await supabaseFetch("messages", "POST", {
      user_id: userId,
      content,
      sender: "user",
      is_auto: false,
      file_url: fileUrl || null,
    });
    console.log('✅ User message saved');

    // 2. Extract topic from message
    const topicMatch = content.match(/\[Topic: ([^\]]+)\]/);
    const userTopic = topicMatch ? topicMatch[1].toLowerCase() : "general";
    console.log('🏷️ Topic:', userTopic);

    // 3. Get conversation history (last 6 messages)
    console.log('📚 Fetching conversation history...');
    const history = await supabaseFetch(
      "messages",
      "GET",
      null,
      `?user_id=eq.${userId}&order=created_at.desc&limit=6`
    );
    console.log(`✅ History: ${history?.length || 0} messages`);

    // 4. Get relevant knowledge base entries
    console.log('📖 Fetching knowledge base...');
    const knowledge = await supabaseFetch(
      "knowledge",
      "GET",
      null,
      `?or=(topic.ilike.%25${userTopic}%25,topic.ilike.%25general%25)&order=priority.desc&limit=4`
    );
    console.log(`✅ Knowledge: ${knowledge?.length || 0} entries`);

    // 5. Get relevant templates
    console.log('🎨 Fetching templates...');
    const templates = await supabaseFetch(
      "templates",
      "GET",
      null,
      `?category=ilike.%25${userTopic}%25&limit=3`
    );
    console.log(`✅ Templates: ${templates?.length || 0} found`);

    // 6. Build AI prompt
    const chat = (history || [])
      .reverse()
      .map(m => {
        const cleanContent = m.content.replace(/\[Topic:[^\]]+\]\s*/g, '');
        return `${m.sender === "user" ? "Customer" : "Agent"}: ${cleanContent}`;
      })
      .join("\n");

    const faqs = (knowledge || [])
      .map(k => `• ${k.content}`)
      .join("\n") || "No specific FAQs available.";

    const tmpl = templates && templates.length > 0
      ? `\n\nAvailable Templates:\n${templates.map(t => 
          `- ${t.name} ($${t.price_usd}): ${t.description}`
        ).join("\n")}`
      : "";

    const cleanUserMessage = content.replace(/\[Topic:[^\]]+\]\s*/g, '');

    const prompt = `You are a friendly support agent for Neodynix Technologies, a company that sells website templates.

KNOWLEDGE BASE:
${faqs}
${tmpl}

RECENT CONVERSATION:
${chat}

CURRENT MESSAGE: ${cleanUserMessage}

INSTRUCTIONS:
- Respond in 1-2 short, helpful sentences
- Be warm and conversational
- If relevant, mention specific templates by name and price
- End with a question or suggested next step
- Keep it under 100 words`;

    console.log('📝 Prompt ready (length:', prompt.length, ')');

    // 7. Call Cloudflare AI
    let aiText = "Thanks for reaching out! Our team will respond shortly.";
    try {
      console.log('🤖 Calling Cloudflare AI...');
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
              { 
                role: "system", 
                content: "You are a concise, friendly support agent. Keep responses under 100 words." 
              },
              { role: "user", content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.7
          }),
        }
      );

      const aiResponseText = await aiRes.text();
      console.log('🤖 AI raw response:', aiResponseText.substring(0, 200));

      if (!aiRes.ok) {
        console.error('❌ AI API error:', aiResponseText);
        throw new Error(`AI API error: ${aiRes.status}`);
      }

      const aiData = JSON.parse(aiResponseText);
      
      // Handle Cloudflare Workers AI response format
      // Format: { result: { response: "text" }, success: true }
      if (aiData.success && aiData.result?.response) {
        aiText = aiData.result.response.trim();
      } else if (aiData.response) {
        aiText = aiData.response.trim();
      } else {
        console.warn('⚠️ Unexpected AI response format:', aiData);
      }
      
      console.log('✅ AI reply extracted:', aiText.substring(0, 100));
    } catch (err) {
      console.error('❌ AI call failed:', err.message);
      // Use fallback message (already set)
    }

    // 8. Save AI response to database
    console.log('💾 Saving AI response...');
    const aiMessage = await supabaseFetch("messages", "POST", {
      user_id: userId,
      content: aiText,
      sender: "support",
      is_auto: true,
    });
    console.log('✅ AI response saved');

    // 9. Return success
    return new Response(JSON.stringify({ 
      success: true, 
      reply: aiText,
      messageId: aiMessage?.[0]?.id
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (err) {
    console.error('💥 Worker error:', err.message, err.stack);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: err.message,
      stack: env.ENVIRONMENT === 'development' ? err.stack : undefined
    }), { 
      status: 500,
      headers: corsHeaders
    });
  }
          }
