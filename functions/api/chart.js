import { Ai } from '@cloudflare/ai';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const env = context.env;
  const request = context.request;
  const ai = new Ai(env.AI);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    const { userId, content, fileUrl } = await request.json();
    if (!userId || !content) {
      return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
    }

    // Save user message
    await supabase.from('messages').insert({
      user_id: userId,
      content,
      sender: 'user',
      is_auto: false,
      file_url: fileUrl
    });

    // Extract topic
    const userTopic = content.match(/\[Topic: ([^\]]+)\]/)?.[1]?.toLowerCase() || 'general';

    // Get chat history (limit to last 8 to avoid token overflow)
    const { data: history } = await supabase
      .from('messages')
      .select('content,sender')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(8);

    // Get knowledge
    const { data: knowledge } = await supabase
      .from('knowledge')
      .select('content')
      .or(`topic.ilike.%${userTopic}%,topic.ilike.%general%`)
      .order('priority', { descending: true })
      .limit(5);

    // Get templates
    const { data: templates } = await supabase
      .from('templates')
      .select('name,category,price_usd,price_ugx,price_ksh,price_tsh,description')
      .ilike('category', `%${userTopic}%`)
      .limit(3);

    // Build context
    const chat = history
      .map(m => `${m.sender === 'user' ? 'User' : 'Agent'}: ${m.content}`)
      .join('\n');
    const faqs = (knowledge || [])
      .map(k => `FAQ: ${k.content}`)
      .join('\n\n');
    const tmpl = templates?.length > 0
      ? `Templates:\n${templates
          .map(t => `- ${t.name} (${t.category}): $${t.price_usd} USD | ${t.price_ugx} UGX | ${t.price_ksh} KES | ${t.price_tsh} TSH\n  Description: ${t.description}`)
          .join('\n')}`
      : 'No matching templates.';

    const prompt = `You are a friendly, expert support agent for Neodynix Technologies.

Business:
- We sell pre-built, customizable website templates.
- Customer picks template → fills form → we customize & launch.
- Form: followup page after email link.
- Pricing: base + hosting ($5/mo) + pages ($2 each) + extras.

Use this data:

${faqs}

${tmpl}

Chat:
${chat}

User: ${content}

Assistant (max 120 words, warm, clear, end with action):`;

    let aiText;
    try {
      const { response } = await ai.run('@cf/meta/llama-3-8b-instruct', { prompt, max_tokens: 150 });
      aiText = response;
    } catch (aiError) {
      console.error('AI error:', aiError);
      aiText = null;
    }

    const reply = (aiText || 'Thanks! Our team will reply soon.').trim();

    // Save AI reply
    await supabase.from('messages').insert({
      user_id: userId,
      content: reply,
      sender: 'support',
      is_auto: true
    });

    return new Response(JSON.stringify({ success: true, reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
            }
