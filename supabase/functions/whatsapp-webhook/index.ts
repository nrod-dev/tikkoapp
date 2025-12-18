import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("WhatsApp Webhook Function Started");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to verify signature
async function verifySignature(request: Request, bodyText: string): Promise<boolean> {
    const signature = request.headers.get('X-Hub-Signature-256');
    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');

    if (!signature || !appSecret) {
        console.warn("Missing signature or app secret");
        return false;
    }

    const [algo, hash] = signature.split('=');
    if (algo !== 'sha256') {
        console.warn("Invalid signature algorithm");
        return false;
    }

    const encoder = new TextEncoder();
    const keyKey = encoder.encode(appSecret);
    const data = encoder.encode(bodyText);

    const key = await crypto.subtle.importKey(
        "raw",
        keyKey,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const verified = await crypto.subtle.verify(
        "HMAC",
        key,
        hexToBytes(hash),
        data
    );

    return verified;
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

Deno.serve(async (req) => {
    const { method } = req

    // 1. CORS Preflight
    if (method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // 2. Health Check
    if (new URL(req.url).pathname === '/') {
        return new Response(JSON.stringify({ status: 'active', service: 'whatsapp-webhook' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        // 3. Webhook Verification (GET)
        if (method === 'GET') {
            const url = new URL(req.url)
            const mode = url.searchParams.get('hub.mode')
            const token = url.searchParams.get('hub.verify_token')
            const challenge = url.searchParams.get('hub.challenge')
            const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')

            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED')
                return new Response(challenge, { status: 200 })
            }
            return new Response('Forbidden', { status: 403 })
        }

        // 4. Message Handling (POST)
        if (method === 'POST') {
            console.log('POST Request Received'); // DEBUG log

            // Clone request to read text for signature verification
            const rawBody = await req.text();
            const signature = req.headers.get('X-Hub-Signature-256');
            console.log(`Signature Header: ${signature}`); // DEBUG log

            // A. Security: Verify Signature
            const isValid = await verifySignature(req, rawBody);
            console.log(`Signature Valid: ${isValid}`); // DEBUG log

            if (!isValid) {
                console.error('Signature Verification Failed. Check WHATSAPP_APP_SECRET.');
                return new Response('Invalid Signature', { status: 403 });
            }

            const payload = JSON.parse(rawBody);

            // B. Separation of Concerns & Batch Processing
            // Iterate over entries and changes
            const entries = payload.entry || [];
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            const supabase = createClient(supabaseUrl, supabaseKey);

            const processingPromises = entries.map(async (entry: any) => {
                const changes = entry.changes || [];

                for (const change of changes) {
                    const value = change.value;

                    // C. Early Return: Filter out non-message events (statuses, etc)
                    if (!value.messages) {
                        console.log("Skipping non-message event:", change.field);
                        continue;
                    }

                    const messages = value.messages;
                    for (const message of messages) {
                        const waMessageId = message.id;
                        const senderPhone = message.from;

                        // D. Idempotency: Upsert message
                        // We persist everything, "processed_status" tracks if we handled logic
                        const { error: upsertError } = await supabase
                            .from('whatsapp_messages')
                            .upsert({
                                wa_message_id: waMessageId,
                                wa_chat_id: senderPhone, // Using phone as chat_id for simple 1:1
                                sender_phone: senderPhone,
                                message_type: message.type,
                                raw_payload: payload, // Store full payload or just the message part? Payload is safer for audit.
                                processed_status: 'pending' // Initial status
                            }, { onConflict: 'wa_message_id' }); // Ignore if exists or update? Update ensures we have it.

                        if (upsertError) {
                            console.error("Failed to persist message:", upsertError);
                            continue;
                        }

                        // E. Async Trigger: Delegate Business Logic
                        // We invoke the worker function asynchronously (fire/forget)
                        // In local dev, we might just log. In prod, use fetch to function URL.
                        console.log(`Message ${waMessageId} persisted. Triggering worker...`);

                        // Optional: Call process-message here
                        // await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-message`, {
                        //    method: 'POST',
                        //    headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
                        //    body: JSON.stringify({ wa_message_id: waMessageId })
                        // }).catch(e => console.error("Worker trigger failed", e));

                        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-message`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ wa_message_id: waMessageId })
                        }).catch(e => console.error("Worker trigger failed", e));
                    }
                }
            });

            await Promise.all(processingPromises);

            return new Response('EVENT_RECEIVED', { status: 200 });
        }

        return new Response('Method Not Allowed', { status: 405 })

    } catch (error) {
        console.error('Webhook Error:', error)
        // Always return 200 to WhatsApp to prevent retries on logic errors, 
        // unless it's a transient system failure we want to retry.
        // Ideally log error and return 200.
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 to acknowledge receipt even if internal logic failed (avoid retry loops)
        })
    }
})
