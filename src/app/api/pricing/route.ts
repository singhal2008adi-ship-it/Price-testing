import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const SERPER_KEY = process.env.SERPER_API_KEY;
    
    if (!GEMINI_KEY) return NextResponse.json({ error: 'Missing Gemini Key' }, { status: 500 });

    // Step 1: Fetch HTML
    let html = '';
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000)
      });
      html = await resp.text();
    } catch {
      // Ignore if HTML fetch fails, Gemini will try from just URL
    }

    // Step 2: Use Gemini to extract and predict prices
    const prompt = html.length > 500
      ? `I have a product page. Here is the HTML (truncated):\n\n${html.slice(0, 8000)}\n\nThe original URL is: ${url}\n\nPlease:\n1. Extract the product title, brand, and the actual selling price (NOT the MRP/strikethrough price - the price the customer actually pays)\n2. For each of these Indian platforms: Myntra, Flipkart, Amazon India, Ajio, Tata CLiQ - give me a direct search URL for this exact product and your best estimate of what it would cost there (based on typical pricing patterns)\n3. The Myntra URL should be the original URL I gave you since that's where we found it.\n\nReturn ONLY clean JSON in this exact format:\n{\n  "product": {\n    "title": "...",\n    "brand": "...",\n    "price": 699\n  },\n  "platforms": [\n    { "name": "Myntra", "price": 699, "url": "https://exact-product-url-or-search" },\n    { "name": "Flipkart", "price": 649, "url": "https://flipkart.com/search?q=..." },\n    { "name": "Amazon", "price": 749, "url": "https://amazon.in/s?k=..." }\n  ]\n}`
      : `Product URL: ${url}\n\nPlease:\n1. Identify the product title, brand, and typical selling price in Indian Rupees\n2. For each of these Indian platforms: Myntra, Flipkart, Amazon India, Ajio, Tata CLiQ - give me a search URL and estimated price\n\nReturn ONLY JSON:\n{\n  "product": { "title": "...", "brand": "...", "price": 699 },\n  "platforms": [\n    { "name": "Myntra", "price": 699, "url": "..." }\n  ]\n}`;

    const gemResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(20000)
      }
    );

    const data = await gemResp.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return NextResponse.json({ error: 'LLM failed to return structured JSON' }, { status: 500 });
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    // Step 3: Optional Google Shopping Cross-Check
    let serperItems = [];
    if (SERPER_KEY && aiResult.product?.title) {
      try {
        const searchQuery = `${aiResult.product.brand || ''} ${aiResult.product.title}`;
        const serperResp = await fetch('https://google.serper.dev/shopping', {
          method: 'POST',
          headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: searchQuery + ' buy india', gl: 'in', hl: 'en', num: 10 }),
          signal: AbortSignal.timeout(8000)
        });
        if (serperResp.ok) {
          const serperData = await serperResp.json();
          serperItems = serperData.shopping || [];
        }
      } catch (err) {
        console.warn('Serper failed:', err);
      }
    }

    return NextResponse.json({
      ai: aiResult,
      googleShopping: serperItems
    });

  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
