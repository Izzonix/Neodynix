// Deploy this as a Cloudflare Worker
// URL: https://your-subdomain.workers.dev/ai-chat

export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { message, topic, knowledgeBase } = await request.json();

      if (!message) {
        return new Response(JSON.stringify({ error: 'Message is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Prepare context from knowledge base
      const context = knowledgeBase && knowledgeBase.length > 0
        ? knowledgeBase.map(k => `Q: ${k.question}\nA: ${k.answer}`).join('\n\n')
        : 'General information: We offer website templates, custom development, and support services.';

      // Use env.AI directly — NO new Ai()
      if (!env.AI) {
        throw new Error('AI binding not configured');
      }

      const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
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
        temperature: 0.7
      });

      const aiMessage = response.response || 
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
      console.error('AI Error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: "I'm having trouble right now. A human agent will assist you shortly.",
        error: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
