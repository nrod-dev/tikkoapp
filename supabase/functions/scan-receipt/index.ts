const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Function scan-receipt initialized");

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY");
            return new Response(JSON.stringify({ error: 'Server key not configured' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }

        const { receiptUrl } = body;
        if (!receiptUrl) {
            return new Response(JSON.stringify({ error: 'Missing receiptUrl' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }

        console.log(`Fetching: ${receiptUrl}`);

        let imageResponse;
        try {
            imageResponse = await fetch(receiptUrl);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`Fetch failed: ${msg}`);
            return new Response(JSON.stringify({ error: `Fetch error: ${msg}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }

        if (!imageResponse.ok) {
            console.error(`Image status: ${imageResponse.status}`);
            return new Response(JSON.stringify({ error: `Image fetch failed: ${imageResponse.status}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
            return new Response(JSON.stringify({ error: 'Empty image' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
        }

        // Convert large ArrayBuffer to Base64 via chunks to avoid "Maximum call stack size exceeded"
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = "";
        const chunkSize = 32768; // 32KB chunks is safe (limit is usually ~65k)

        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, i + chunkSize);
            binaryString += String.fromCharCode(...chunk);
        }

        const base64Image = btoa(binaryString);
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

        const prompt = `Analyze this receipt. Return ONLY valid JSON:
        {
          "merchant_name": "string",
          "date": "YYYY-MM-DD",
          "amount": number,
          "currency": "ARS" | "USD",
          "iva_amount": number | null,
          "category": "Otros servicios" | "Hogar" | "Aeorolinea" | "Transporte" | "Alojamiento" | "Salud" | "Viajes y Turismo" | "Electro y Tecnologia" | "Servicios Financieros" | "Comercio Minorista" | "Combustible" | "Recreacion" | "Cuidado y Belleza" | "Gastronomia" | "Jugueteria" | "Educación" | "Supermercado" | "Servicios Publicos"
        }`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // Simplified payload construction
        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: base64Image } }
                ]
            }]
        };

        console.log("Calling Gemini...");
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const txt = await geminiResponse.text();
            console.error(`Gemini error ${geminiResponse.status}: ${txt}`);
            return new Response(JSON.stringify({ error: `AI Error ${geminiResponse.status}: ${txt}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
        }

        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("No text in Gemini response");
            return new Response(JSON.stringify({ error: 'No analysis result' }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
        }

        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(clean);

        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err) {
        // Paranoid error logging to prevent stack overflow in error reporting
        const safeParams = { message: 'Internal Error' };
        if (err instanceof Error) {
            console.error("Internal Error Message:", err.message);
            console.error("Internal Error Stack:", err.stack);
        } else {
            console.error("Internal Error Unknown:", String(err));
        }

        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
