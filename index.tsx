
document.addEventListener('DOMContentLoaded', () => {
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

    const getCookieValue = (name: string) => {
        const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`));
        return value ? decodeURIComponent(value.split('=')[1]) : '';
    };

    const generateEventId = () => {
        if (window.crypto && 'randomUUID' in window.crypto) {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const trackMetaPixelEvent = (eventName: string, eventId: string) => {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
            fbq('track', eventName, {}, { eventID: eventId });
        }
    };

    const sendCapiEvent = async (
        eventName: string,
        eventId: string,
        customData: Record<string, string> = {}
    ) => {
        const storedUtms = getStoredUtms() ?? {};
        const fbp = getCookieValue('_fbp');
        const fbc = getCookieValue('_fbc');

        const userData: Record<string, string> = {};
        if (fbp) {
            userData.fbp = fbp;
        }
        if (fbc) {
            userData.fbc = fbc;
        }

        const payload: Record<string, unknown> = {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            event_source_url: window.location.href,
            user_data: userData,
            custom_data: { ...storedUtms, ...customData },
            referrer_url: document.referrer || undefined,
        };

        try {
            await fetch('/api/meta-capi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            console.warn('Failed to send Meta CAPI event', error);
        }
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

    const initCheckoutTracking = () => {
        const checkoutLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="pay.cakto.com.br"]');

        checkoutLinks.forEach(link => {
            link.addEventListener('click', () => {
                const contentId = link.dataset.contentId ?? '';
                const contentName = link.dataset.contentName ?? '';
                const contentValue = link.dataset.contentValue ?? '';
                const contentCurrency = link.dataset.contentCurrency ?? 'BRL';
                const numericValue = Number(contentValue);

                const checkoutData = {
                    content_id: contentId,
                    content_name: contentName,
                    value: numericValue,
                    currency: contentCurrency
                };

                localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(checkoutData));

                try {
                    const url = new URL(link.href);
                    if (contentId) {
                        url.searchParams.set('content_id', contentId);
                    }
                    if (contentValue) {
                        url.searchParams.set('value', contentValue);
                    }
                    if (contentCurrency) {
                        url.searchParams.set('currency', contentCurrency);
                    }
                    link.href = url.toString();
                } catch (e) {
                    console.warn('Failed to append checkout metadata:', link.href);
                }

                const ttq = (window as { ttq?: { track?: (event: string, payload: Record<string, unknown>) => void } }).ttq;
                if (ttq && typeof ttq.track === 'function') {
                    const payload: Record<string, unknown> = {
                        contents: [
                            {
                                content_id: contentId,
                                content_type: 'product',
                                content_name: contentName
                            }
                        ],
                        currency: contentCurrency
                    };

                    if (Number.isFinite(numericValue)) {
                        payload.value = numericValue;
                    }

                    ttq.track('InitiateCheckout', payload);
                }
            });
        });
    };

    // Run attribution logic
    captureAttribution();
    applyUtmsToLinks();
    initCheckoutTracking();

    const pageViewEventId = generateEventId();
    trackMetaPixelEvent('PageView', pageViewEventId);
    void sendCapiEvent('PageView', pageViewEventId);

    const registerCheckoutTracking = () => {
        const checkoutLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="pay.cakto.com.br"]');
        checkoutLinks.forEach(link => {
            link.addEventListener('click', () => {
                const eventId = generateEventId();
                trackMetaPixelEvent('InitiateCheckout', eventId);
                void sendCapiEvent('InitiateCheckout', eventId);
            });
        });
    };
    registerCheckoutTracking();

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
