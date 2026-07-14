document.addEventListener('DOMContentLoaded', () => {
    const META_PIXEL_ID = '1083649257004430';

    type FbqFunction = ((...args: unknown[]) => void) & {
        callMethod?: (...args: unknown[]) => void;
        queue?: unknown[];
        push?: FbqFunction;
        loaded?: boolean;
        version?: string;
    };

    type MetaWindow = Window & typeof globalThis & {
        fbq?: FbqFunction;
        _fbq?: FbqFunction;
        __META_PIXEL_ID__?: string;
        __META_PAGE_VIEW_EVENT_ID__?: string;
        __META_PAGE_VIEW_TRACK_CALLED__?: boolean;
        __META_PAGE_VIEW_TS_FALLBACK_SENT__?: boolean;
        __META_PAGE_VIEW_RESOURCE_FALLBACK_SENT__?: boolean;
    };

    const metaWindow = window as MetaWindow;

    const createEventId = (eventName: string) => `${eventName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const appendDefinedParams = (url: URL, params: Record<string, string | number | undefined>) => {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                url.searchParams.set(key, String(value));
            }
        });
    };

    const sendMetaBeacon = (eventName: string, eventId: string, payload: Record<string, string | number | undefined> = {}) => {
        const url = new URL('https://www.facebook.com/tr');
        appendDefinedParams(url, {
            id: META_PIXEL_ID,
            ev: eventName,
            noscript: 0,
            eventID: eventId,
            dl: window.location.href,
            rl: document.referrer || undefined,
            if: 'false',
            ts: Date.now(),
            ...payload
        });

        const img = new Image(1, 1);
        img.style.display = 'none';
        img.src = url.toString();
    };

    const ensureMetaPixel = () => {
        if (!metaWindow.fbq) {
            const fbq = function(...args: unknown[]) {
                if (fbq.callMethod) {
                    fbq.callMethod(...args);
                } else {
                    fbq.queue?.push(args);
                }
            } as FbqFunction;

            fbq.queue = [];
            fbq.push = fbq;
            fbq.loaded = true;
            fbq.version = '2.0';
            metaWindow.fbq = fbq;
            metaWindow._fbq = metaWindow._fbq || fbq;
        }

        if (!document.querySelector<HTMLScriptElement>('script[src="https://connect.facebook.net/en_US/fbevents.js"]')) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://connect.facebook.net/en_US/fbevents.js';
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode?.insertBefore(script, firstScript);
        }

        return metaWindow.fbq;
    };

    const initMetaPixelFallback = () => {
        if (metaWindow.__META_PAGE_VIEW_TRACK_CALLED__) return;

        const fbq = ensureMetaPixel();
        const eventId = metaWindow.__META_PAGE_VIEW_EVENT_ID__ || createEventId('PageView');
        metaWindow.__META_PIXEL_ID__ = META_PIXEL_ID;
        metaWindow.__META_PAGE_VIEW_EVENT_ID__ = eventId;

        fbq?.('init', META_PIXEL_ID);
        fbq?.('track', 'PageView', {}, { eventID: eventId });
        metaWindow.__META_PAGE_VIEW_TRACK_CALLED__ = true;
        metaWindow.__META_PAGE_VIEW_TS_FALLBACK_SENT__ = true;
    };

    const trackMetaEvent = (eventName: string, eventId: string, payload: Record<string, unknown> = {}) => {
        const fbq = ensureMetaPixel();
        fbq?.('track', eventName, payload, { eventID: eventId });
    };

    initMetaPixelFallback();
    const throttle = (func: (...args: any[]) => void, limit: number) => {
        let inThrottle: boolean;
        return function(this: any, ...args: any[]) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // --- Attribution Logic (UTM + Organic) ---
    const UTM_STORAGE_KEY = 'deepstudy_utm_data';
    const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    const getStoredUtms = () => {
        const stored = localStorage.getItem(UTM_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    };

    const captureAttribution = () => {
        // First-touch logic: if already stored, don't overwrite
        if (getStoredUtms()) return;

        const urlParams = new URLSearchParams(window.location.search);
        let attributionData: Record<string, string> = {};

        // 1. Check URL for UTMs
        let hasUtmsInUrl = false;
        UTM_PARAMS.forEach(param => {
            const value = urlParams.get(param);
            if (value) {
                attributionData[param] = value;
                hasUtmsInUrl = true;
            }
        });

        // 2. If no UTMs, check Referrer
        if (!hasUtmsInUrl) {
            const referrer = document.referrer.toLowerCase();
            
            if (!referrer) {
                attributionData = { utm_source: 'direct', utm_medium: 'none' };
            } else if (referrer.includes('tiktok.com')) {
                attributionData = { utm_source: 'tiktok', utm_medium: 'organic' };
            } else if (referrer.includes('google.')) {
                attributionData = { utm_source: 'google', utm_medium: 'organic' };
            } else if (referrer.includes('instagram.com') || referrer.includes('facebook.com') || referrer.includes('fb.me')) {
                attributionData = { utm_source: 'meta', utm_medium: 'organic' };
            } else {
                // Generic referrer fallback
                try {
                    const refUrl = new URL(referrer);
                    attributionData = { utm_source: refUrl.hostname, utm_medium: 'referral' };
                } catch (e) {
                    attributionData = { utm_source: 'other', utm_medium: 'referral' };
                }
            }
        }

        if (Object.keys(attributionData).length > 0) {
            localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attributionData));
        }
    };

    const applyUtmsToLinks = () => {
        const data = getStoredUtms();
        if (!data) return;

        const checkoutLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="pay.cakto.com.br"]');
        checkoutLinks.forEach(link => {
            try {
                const url = new URL(link.href);
                Object.entries(data).forEach(([key, value]) => {
                    // Only append if the parameter doesn't already exist in the hardcoded URL
                    if (!url.searchParams.has(key)) {
                        url.searchParams.set(key, value as string);
                    }
                });
                link.href = url.toString();
            } catch (e) {
                console.warn('Failed to append UTMs to link:', link.href);
            }
        });
    };

    const CHECKOUT_STORAGE_KEY = 'deepstudy_checkout_data';

    const buildCheckoutPayload = (link: HTMLAnchorElement) => {
        const contentId = link.dataset.contentId ?? '';
        const contentName = link.dataset.contentName ?? '';
        const contentValue = link.dataset.contentValue ?? '';
        const contentCurrency = link.dataset.contentCurrency ?? 'BRL';
        const numericValue = Number(contentValue);
        const payload: Record<string, unknown> = {
            content_ids: contentId ? [contentId] : [],
            content_name: contentName,
            content_type: 'product',
            contents: [
                {
                    id: contentId,
                    quantity: 1,
                    item_price: Number.isFinite(numericValue) ? numericValue : undefined
                }
            ],
            currency: contentCurrency
        };

        if (Number.isFinite(numericValue)) {
            payload.value = numericValue;
        }

        return { contentId, contentName, contentValue, contentCurrency, numericValue, payload };
    };

    const persistAndApplyCheckoutMetadata = (link: HTMLAnchorElement) => {
        const checkout = buildCheckoutPayload(link);
        const checkoutData = {
            content_id: checkout.contentId,
            content_name: checkout.contentName,
            value: checkout.numericValue,
            currency: checkout.contentCurrency
        };

        localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkoutData));

        try {
            const url = new URL(link.href);
            appendDefinedParams(url, {
                content_id: checkout.contentId,
                value: checkout.contentValue,
                currency: checkout.contentCurrency
            });
            link.href = url.toString();
        } catch (e) {
            console.warn('Failed to append checkout metadata:', link.href);
        }

        return checkout;
    };

    const initCheckoutTracking = () => {
        const checkoutLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="pay.cakto.com.br"]');

        checkoutLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                const checkout = persistAndApplyCheckoutMetadata(link);
                const eventId = createEventId('InitiateCheckout');
                const beaconPayload = {
                    cd: checkout.contentId,
                    cn: checkout.contentName,
                    cu: checkout.contentCurrency,
                    value: Number.isFinite(checkout.numericValue) ? checkout.numericValue : undefined
                };

                trackMetaEvent('InitiateCheckout', eventId, checkout.payload);
                sendMetaBeacon('InitiateCheckout', eventId, beaconPayload);

                const ttq = (window as { ttq?: { track?: (event: string, payload: Record<string, unknown>) => void } }).ttq;
                if (ttq && typeof ttq.track === 'function') {
                    const tiktokPayload: Record<string, unknown> = {
                        contents: [
                            {
                                content_id: checkout.contentId,
                                content_type: 'product',
                                content_name: checkout.contentName
                            }
                        ],
                        currency: checkout.contentCurrency
                    };

                    if (Number.isFinite(checkout.numericValue)) {
                        tiktokPayload.value = checkout.numericValue;
                    }

                    ttq.track('InitiateCheckout', tiktokPayload);
                }

                const isModifiedNavigation = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || link.target === '_blank';
                if (isModifiedNavigation) return;

                event.preventDefault();
                window.setTimeout(() => {
                    window.location.href = link.href;
                }, 700);
            });
        });
    };

    const getStoredCheckoutData = () => {
        try {
            const stored = localStorage.getItem(CHECKOUT_STORAGE_KEY);
            return stored ? JSON.parse(stored) as Record<string, string | number | undefined> : {};
        } catch (error) {
            return {};
        }
    };

    const initPurchaseTracking = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const metaEvent = urlParams.get('meta_event')?.toLowerCase();
        const purchase = urlParams.get('purchase')?.toLowerCase();
        const status = urlParams.get('status')?.toLowerCase();
        const paymentStatus = urlParams.get('payment_status')?.toLowerCase();
        const isPurchaseSuccess = metaEvent === 'purchase' || purchase === 'success' || status === 'approved' || status === 'paid' || paymentStatus === 'approved' || paymentStatus === 'paid';

        if (!isPurchaseSuccess) return;

        const checkoutData = getStoredCheckoutData();
        const value = Number(urlParams.get('value') ?? checkoutData.value);
        const currency = urlParams.get('currency') ?? String(checkoutData.currency ?? 'BRL');
        const contentId = urlParams.get('content_id') ?? String(checkoutData.content_id ?? '');
        const contentName = String(checkoutData.content_name ?? contentId);
        const eventId = createEventId('Purchase');
        const payload: Record<string, unknown> = {
            content_ids: contentId ? [contentId] : [],
            content_name: contentName,
            content_type: 'product',
            contents: [
                {
                    id: contentId,
                    quantity: 1,
                    item_price: Number.isFinite(value) ? value : undefined
                }
            ],
            currency
        };

        if (Number.isFinite(value)) {
            payload.value = value;
        }

        trackMetaEvent('Purchase', eventId, payload);
        sendMetaBeacon('Purchase', eventId, {
            cd: contentId,
            cn: contentName,
            cu: currency,
            value: Number.isFinite(value) ? value : undefined
        });
    };

    // Run attribution logic
    captureAttribution();
    applyUtmsToLinks();
    initCheckoutTracking();
    initPurchaseTracking();

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // JS-based smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                const targetElement = document.querySelector<HTMLElement>(href);
                if (targetElement) {
                    const scrollPaddingTop = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 100;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - scrollPaddingTop;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    if (mobileMenu && !mobileMenu.classList.contains('hidden') && this.closest('#mobile-menu')) {
                        mobileMenu.classList.add('hidden');
                    }
                }
            }
        });
    });

    // FAQ Accordion
    const initFaqAccordion = () => {
        const accordion = document.querySelector('.faq-accordion');
        if(accordion){
            const faqToggles = accordion.querySelectorAll('.faq-toggle');
            faqToggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const answer = toggle.nextElementSibling;
                    const icon = toggle.querySelector('.faq-icon');
                    
                    answer?.classList.toggle('hidden');
                    icon?.classList.toggle('rotate-180');
                });
            });
        }
    };
    initFaqAccordion();

    // Active nav link on scroll
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('header a.nav-link');
    const header = document.getElementById('header');
    const headerHeight = header?.offsetHeight ?? 64;

    const onScroll = () => {
        const scrollPosition = window.scrollY + headerHeight + 50;
        let activeSectionId = '';

        sections.forEach(section => {
            const sectionEl = section as HTMLElement;
            if (scrollPosition >= sectionEl.offsetTop) {
                activeSectionId = section.id;
            }
        });

        navLinks.forEach(link => {
            const navId = link.getAttribute('data-nav-id');
            if (navId === activeSectionId) {
                link.classList.add('text-brand-600', 'dark:text-brand-400', 'font-bold');
                link.classList.remove('text-slate-700', 'dark:text-slate-200', 'font-medium');
            } else {
                link.classList.remove('text-brand-600', 'dark:text-brand-400', 'font-bold');
                link.classList.add('text-slate-700', 'dark:text-slate-200', 'font-medium');
            }
        });
    };

    window.addEventListener('scroll', throttle(onScroll, 200), { passive: true });
    onScroll(); 
});
