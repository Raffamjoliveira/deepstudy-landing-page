type MetaCapiEvent = {
    event_name: string;
    event_time: number;
    event_id?: string;
    event_source_url?: string;
    user_data?: Record<string, string>;
    custom_data?: Record<string, unknown>;
    referrer_url?: string;
    action_source?: string;
    opt_out?: boolean;
    data_processing_options?: string[];
    data_processing_options_country?: number;
    data_processing_options_state?: number;
};

const getClientIp = (req: any) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? '';
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Allow', 'POST');
        res.end('Method Not Allowed');
        return;
    }

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing Meta API configuration.' }));
        return;
    }

    let body = req.body;
    if (!body) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
            chunks.push(chunk as Buffer);
        }
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }

    const event: MetaCapiEvent = {
        event_name: body.event_name,
        event_time: body.event_time ?? Math.floor(Date.now() / 1000),
        event_id: body.event_id,
        event_source_url: body.event_source_url,
        user_data: body.user_data ?? {},
        custom_data: body.custom_data ?? {},
        referrer_url: body.referrer_url,
        action_source: 'website',
        opt_out: body.opt_out,
        data_processing_options: body.data_processing_options,
        data_processing_options_country: body.data_processing_options_country,
        data_processing_options_state: body.data_processing_options_state,
    };

    const clientIp = getClientIp(req);
    const clientUserAgent = req.headers['user-agent'];

    if (clientIp) {
        event.user_data = { ...event.user_data, client_ip_address: clientIp };
    }
    if (typeof clientUserAgent === 'string') {
        event.user_data = { ...event.user_data, client_user_agent: clientUserAgent };
    }

    const payload = {
        data: [event],
        test_event_code: body.test_event_code ?? process.env.META_TEST_EVENT_CODE,
    } as Record<string, unknown>;

    if (!payload.test_event_code) {
        delete payload.test_event_code;
    }

    const response = await fetch(
        `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }
    );

    const result = await response.json();
    res.statusCode = response.ok ? 200 : response.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
}
