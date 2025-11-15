// functions/ai-chat/index.js
// Cloudflare Pages Function — export named handlers (onRequestPost, onRequestOptions)
// Deploy under: functions/ai-chat/index.js

export async function onRequestOptions({ request }) {
  // CORS preflight
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
    },
  });
}

export async function onRequestPost({ request, env }) {
  // Ensure JSON body
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Expected application/json' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const { message, topic, knowledgeBase } = body || {};

  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Build context from provided knowledge base (if any)
  const context = Array.isArray(knowledgeBase) && knowledgeBase.length > 0
    ? knowledgeBase
        .map(k => {
          // tolerate objects with question/answer or q/a keys
          const q = k.question ?? k.q ?? '';
          const a = k.answer ?? k.a ?? '';
          return `Q: ${q}\nA: ${a}`;
        })
        .join('\n\n')
    : 'General information: We offer website templates, custom development, and support services.';

  // Ensure AI binding is configured
  if (!env?.AI) {
    return new Response(JSON.stringify({
      success: false,
      message: "AI binding not configured on this environment."
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const resp = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer support assistant for Neodynix Technologies, a web development company specializing in affordable website templates and custom solutions.

Use the following knowledge base to answer questions accurately and helpfully:

${context}

Guidelines:
- Be friendly, professional, and concise (2-3 sentences max)
- If you don't find the answer in the knowledge base, politely say you'll connect them with a human agent
- Focus on the topic: ${topic || 'general inquiry'}
- Never make up information not in the knowledge base
- Always be encouraging and helpful
- If asked about pricing, direct them to the templates page or calculator
- For technical issues, suggest contacting human support`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 256,
      temperature: 0.7,
    });

    // AI binding shape may vary; prefer resp.response, fallback to resp.choices or resp.output
    const aiMessage =
      (resp && (resp.response || (resp.output && resp.output[0]) || (resp.choices && resp.choices[0]?.text))) ||
      "I'll connect you with our support team for personalized assistance.";

    return new Response(JSON.stringify({
      success: true,
      message: aiMessage
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // Log server-side; Pages Functions don't expose console logs to client
    console.error('AI Error:', error);

    return new Response(JSON.stringify({
      success: false,
      message: "I'm having trouble right now. A human agent will assist you shortly.",
      error: error?.message ?? String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
      }
