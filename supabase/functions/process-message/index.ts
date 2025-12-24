import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0'; // Or latest version

// --- Helpers ---

async function sendWhatsAppMessage(to: string, text: string, contextId?: string) {
    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');

    if (!token || !phoneId) {
        console.error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID");
        return;
    }

    const payload: any = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
    };

    if (contextId) {
        payload.context = { message_id: contextId };
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Error sending message to ${to}:`, err);
    }
}

async function sendWhatsAppInteractiveButtons(to: string, text: string, buttons: { id: string, title: string }[], contextId?: string) {
    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');

    if (!token || !phoneId) {
        console.error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID");
        return;
    }

    const payload: any = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: text },
            action: {
                buttons: buttons.map(b => ({
                    type: 'reply',
                    reply: {
                        id: b.id,
                        title: b.title
                    }
                }))
            }
        }
    };

    if (contextId) {
        payload.context = { message_id: contextId };
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Error sending interactive message to ${to}:`, err);
    }
}

async function downloadWhatsAppMedia(mediaId: string): Promise<{ buffer: ArrayBuffer, mimeType: string }> {
    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (!token) throw new Error("Missing WHATSAPP_ACCESS_TOKEN");

    // 1. Get Media URL
    const urlResponse = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!urlResponse.ok) {
        throw new Error(`Failed to get media URL: ${await urlResponse.text()}`);
    }

    const urlData = await urlResponse.json();
    const mediaUrl = urlData.url;
    const mimeType = urlData.mime_type;

    // 2. Download Media (with Auth)
    const mediaResponse = await fetch(mediaUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!mediaResponse.ok) {
        throw new Error(`Failed to download media binary: ${mediaResponse.statusText}`);
    }

    const buffer = await mediaResponse.arrayBuffer();
    return { buffer, mimeType };
}


async function processImage(mediaId: string, apiKey: string): Promise<any> {

    console.log("Downloading media...", mediaId);
    const { buffer, mimeType } = await downloadWhatsAppMedia(mediaId);

    // Native base64 for Deno - processing in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(buffer);
    let binaryString = "";
    const chunkSize = 32768;

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
    }
    const base64Image = btoa(binaryString);

    const prompt = `
        Analyze this receipt image and extract the following information in JSON format:
        - merchant_name: The name of the merchant or store.
        - date: The date of the transaction in YYYY-MM-DD format.
        - amount: The total amount paid (number only, no symbols).
        - currency: The currency code (e.g., ARS, USD). Assume ARS if in Argentina context or unclear.
        - iva_amount: The explicit VAT/IVA amount if found, otherwise null. (number only).
        - category: Choose the best fit from: ["Otros servicios", "Hogar", "Aeorolinea", "Transporte", "Alojamiento", "Salud", "Viajes y Turismo", "Electro y Tecnologia", "Servicios Financieros", "Comercio Minorista", "Combustible", "Recreacion", "Cuidado y Belleza", "Gastronomia", "Jugueteria", "Educación", "Supermercado", "Servicios Publicos"].
        
        Return ONLY the valid JSON string.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiPayload = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Image } }
            ]
        }]
    };

    const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        throw new Error(`Gemini API Error: ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) throw new Error("No text from Gemini");

    const cleanText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

// --- Main Worker ---

Deno.serve(async (req) => {
    try {
        const payload = await req.json();
        const { wa_message_id } = payload; // Payload from webhook trigger

        // For manual testing or direct invocation
        if (!wa_message_id) {
            return new Response('Missing wa_message_id', { status: 400 });
        }

        // 1. Setup Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Get Message & Session
        const { data: message, error: msgError } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('wa_message_id', wa_message_id)
            .single();

        if (msgError || !message) {
            console.error("Message not found:", msgError);
            return new Response('Message not found', { status: 404 });
        }

        if (message.processed_status === 'processed') {
            return new Response('Already processed', { status: 200 });
        }

        const senderPhone = message.sender_phone;

        // Get or Create Session
        let { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('phone_number', senderPhone)
            .single();

        if (!session) {
            // Try to find user profile to link
            const { data: profile } = await supabase.from('profiles').select('id').eq('whatsapp_number', senderPhone).single();
            let userId = profile?.id || null;

            // If not in profiles, check collaborators
            let isCollaborator = false;
            if (!userId) {
                const { data: collaborator } = await supabase.from('collaborators').select('id').eq('phone', senderPhone).single();
                if (collaborator) {
                    userId = collaborator.id;
                    isCollaborator = true;
                }
            }

            const { data: newSession, error: createError } = await supabase
                .from('whatsapp_sessions')
                .insert({ phone_number: senderPhone, user_id: userId, current_state: 'IDLE' })
                .select()
                .single();

            if (createError) throw createError;
            session = newSession;
        }

        // Stop if user not registered
        if (!session.user_id) {
            await sendWhatsAppMessage(senderPhone, "Hola! 👋 No reconocemos este número. Por favor contacta a soporte para registrarte.", wa_message_id);
            await supabase.from('whatsapp_messages').update({ processed_status: 'failed_auth' }).eq('id', message.id);
            return new Response('User not found', { status: 200 });
        }

        // 3. State Machine Logic
        const currentState = session.current_state;
        const msgType = message.message_type; // 'text' or 'image'

        // Extract body handling both text/image caption and BUTTON REPLIES
        let msgBody = "";
        const rawMessage = message.raw_payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (rawMessage?.interactive?.button_reply) {
            msgBody = rawMessage.interactive.button_reply.title; // Use button title as the text body (e.g., "Si", "Editar")
        } else {
            msgBody = rawMessage?.text?.body || "";
        }

        console.log(`Processing message ${wa_message_id} from ${senderPhone}. State: ${currentState}. Type: ${msgType}`);

        // --- GLOBAL COMMANDS (CANCEL) ---
        if (['cancelar', 'cancel'].includes(msgBody.toLowerCase().trim()) && currentState !== 'IDLE') {
            await supabase.from('whatsapp_sessions').update({ current_state: 'IDLE', temp_data: {} }).eq('id', session.id);
            await sendWhatsAppMessage(senderPhone, "🚫 Operación cancelada. Envíame un nuevo ticket cuando quieras.", wa_message_id);

            // Mark processed
            await supabase.from('whatsapp_messages').update({ processed_status: 'processed' }).eq('id', message.id);
            return new Response('Cancelled', { status: 200 });
        }


        // --- CASE: IDLE ---
        if (currentState === 'IDLE') {
            if (msgType === 'image') {
                const mediaId = message.raw_payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.image?.id;
                if (!mediaId) {
                    await sendWhatsAppMessage(senderPhone, "No pude descargar la imagen.", wa_message_id);
                    return new Response('No media ID', { status: 200 });
                }

                await sendWhatsAppMessage(senderPhone, "Procesando comprobante... 🧾⏳", wa_message_id);

                try {
                    const extractedData = await processImage(mediaId, Deno.env.get('GEMINI_API_KEY') || '');

                    // Update Session
                    await supabase.from('whatsapp_sessions').update({
                        current_state: 'WAITING_CONFIRMATION',
                        temp_data: extractedData
                    }).eq('id', session.id);

                    const summary = `Leí esto:\n🏢 Comercio: ${extractedData.merchant_name}\n📅 Fecha: ${extractedData.date}\n💰 Monto: $${extractedData.amount} ${extractedData.currency}\n💵 IVA: ${extractedData.iva_amount ? '$' + extractedData.iva_amount : 'No discriminado'}\n🏷️ Categoría: ${extractedData.category}\n\n¿Es correcto?`;

                    await sendWhatsAppInteractiveButtons(
                        senderPhone,
                        summary,
                        [
                            { id: 'confirm_yes', title: 'Si, cargar gasto' },
                            { id: 'confirm_edit', title: 'Editar datos' },
                            { id: 'confirm_cancel', title: 'Cancelar' }
                        ],
                        wa_message_id
                    );

                } catch (e) {
                    console.error("Gemini/Image Error:", e);
                    await sendWhatsAppMessage(senderPhone, "Tuve un problema leyendo la imagen. 😕 Intenta sacarla más clara o con mejor luz.", wa_message_id);
                }
            } else {
                await sendWhatsAppMessage(senderPhone, "Envíame una foto de un ticket o factura para empezar. 📸", wa_message_id);
            }
        }

        // --- CASE: WAITING_CONFIRMATION ---
        else if (currentState === 'WAITING_CONFIRMATION') {
            const text = msgBody.toLowerCase().trim();

            if (['si', 'sí', 'confirmar', 'ok', 'correcto'].includes(text)) {
                // SAVE TICKET
                const ticketData = session.temp_data;

                // Get Organization ID
                let orgId: string | null = null;
                let isCollaborator = false;

                // Check if user is a collaborator
                const { data: collaborator } = await supabase.from('collaborators').select('organization_id, id').eq('id', session.user_id).single();

                if (collaborator) {
                    orgId = collaborator.organization_id;
                    isCollaborator = true;
                } else {
                    // Fallback to Organization Members for standard users
                    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user_id).limit(1).single();
                    orgId = membership?.organization_id;
                }

                if (!orgId) {
                    await sendWhatsAppMessage(senderPhone, "Error: No perteneces a ninguna organización.", wa_message_id);
                } else {

                    const insertPayload: any = {
                        organization_id: orgId,
                        date: ticketData.date,
                        amount: ticketData.amount,
                        currency: ticketData.currency,
                        merchant_name: ticketData.merchant_name,
                        category: ticketData.category,
                        iva_amount: ticketData.iva_amount,
                        status: 'pendiente', // As requested
                        source: 'whatsapp'
                    };

                    if (isCollaborator) {
                        insertPayload.collaborator_id = session.user_id;
                        // created_by is left undefined/null because they don't have a profile
                    } else {
                        insertPayload.created_by = session.user_id;
                    }

                    const { error: insertError } = await supabase.from('tickets').insert(insertPayload);

                    if (insertError) {
                        console.error("Ticket Insert Error:", insertError);
                        await sendWhatsAppMessage(senderPhone, "Error guardando el ticket. Intenta de nuevo.", wa_message_id);
                    } else {
                        await sendWhatsAppMessage(senderPhone, "✅ Ticket guardado exitosamente!", wa_message_id);
                        // Reset Session
                        await supabase.from('whatsapp_sessions').update({ current_state: 'IDLE', temp_data: {} }).eq('id', session.id);
                    }
                }

            } else if (text.includes('editar') || text.includes('no')) {
                await sendWhatsAppMessage(senderPhone, "¿Qué dato quieres corregir? Escribe el cambio así: 'Monto: 5000' o 'Fecha: 2023-12-01'. O escribe 'Cancelar'.", wa_message_id);
                await supabase.from('whatsapp_sessions').update({ current_state: 'EDITING' }).eq('id', session.id);
            } else {
                await sendWhatsAppInteractiveButtons(
                    senderPhone,
                    "Por favor selecciona una opción:",
                    [
                        { id: 'confirm_yes', title: 'Si' },
                        { id: 'confirm_edit', title: 'Editar' },
                        { id: 'confirm_cancel', title: 'Cancelar' }
                    ],
                    wa_message_id
                );
            }
        }

        // --- CASE: EDITING ---
        else if (currentState === 'EDITING') {
            // Simple regex parsing for "Key: Value"
            const text = msgBody;
            const parts = text.split(':');

            if (parts.length < 2) {
                await sendWhatsAppMessage(senderPhone, "Formato no entendido. Usa 'Campo: Valor'. Ej: 'Monto: 1500'. O escribe 'Cancelar'.", wa_message_id);
            } else {
                const fieldMap: any = {
                    'monto': 'amount',
                    'fecha': 'date',
                    'comercio': 'merchant_name',
                    'categoria': 'category',
                    'categoría': 'category',
                    'iva': 'iva_amount'
                };

                const rawField = parts[0].trim().toLowerCase();
                const value = parts[1].trim();
                const key = fieldMap[rawField] || rawField; // Fallback to raw if not mapped

                const currentData = session.temp_data || {};
                currentData[key] = value;

                // Save updated data
                await supabase.from('whatsapp_sessions').update({
                    current_state: 'WAITING_CONFIRMATION',
                    temp_data: currentData
                }).eq('id', session.id);

                const summary = `Dato actualizado. Revisemos:\n🏢 Comercio: ${currentData.merchant_name}\n📅 Fecha: ${currentData.date}\n💰 Monto: $${currentData.amount} ${currentData.currency}\n💵 IVA: ${currentData.iva_amount ? '$' + currentData.iva_amount : 'No discriminado'}\n\n¿Confirmamos ahora? (Responde *Sí*)`;
                await sendWhatsAppMessage(senderPhone, summary, wa_message_id);
            }
        }

        // 4. Mark Message as Processed
        await supabase.from('whatsapp_messages').update({ processed_status: 'processed' }).eq('id', message.id);

        return new Response('Processed', { status: 200 });

    } catch (error) {
        console.error('Worker Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
