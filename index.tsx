
document.addEventListener('DOMContentLoaded', () => {
    const META_PIXEL_ID = '1083649257004430';

    type MetaPixelEventPayload = Record<string, string | number | boolean | undefined>;

    const loadMetaPixelBase = () => {
        const win = window as typeof window & {
            fbq?: (...args: any[]) => void;
            _fbq?: (...args: any[]) => void;
            __deepstudyMetaPixelInitialized?: boolean;
            __deepstudyMetaPageViewTracked?: boolean;
        };

        if (!win.fbq) {
            const fbq = function(this: unknown, ...args: any[]) {
                if (fbq.callMethod) {
                    fbq.callMethod.apply(fbq, args);
                } else {
                    fbq.queue.push(args);
                }
            } as ((...args: any[]) => void) & {
                callMethod?: (...args: any[]) => void;
                queue: any[];
                push: (...args: any[]) => void;
                loaded: boolean;
                version: string;
            };

            win.fbq = fbq;
            if (!win._fbq) win._fbq = fbq;

            fbq.push = fbq;
            fbq.loaded = true;
            fbq.version = '2.0';
            fbq.queue = [];

            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://connect.facebook.net/en_US/fbevents.js';
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode?.insertBefore(script, firstScript);
        }

        if (!win.__deepstudyMetaPixelInitialized) {
            win.fbq('init', META_PIXEL_ID);
            win.__deepstudyMetaPixelInitialized = true;
        }

        if (!win.__deepstudyMetaPageViewTracked) {
            win.fbq('track', 'PageView');
            win.__deepstudyMetaPageViewTracked = true;
        }
    };

    const trackMetaEvent = (eventName: string, payload?: MetaPixelEventPayload) => {
        const win = window as typeof window & { fbq?: (...args: any[]) => void };

        if (!win.fbq) {
            loadMetaPixelBase();
        }

        win.fbq?.('track', eventName, payload ?? {});
    };

    loadMetaPixelBase();

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

    // Run attribution logic
    captureAttribution();
    applyUtmsToLinks();

    const initMetaPixelCheckoutTracking = () => {
        const checkoutLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="pay.cakto.com.br"]');

        checkoutLinks.forEach(link => {
            link.addEventListener('click', () => {
                trackMetaEvent('InitiateCheckout', {
                    content_name: link.dataset.planName || link.textContent?.trim() || 'DeepStudy checkout',
                    content_ids: link.dataset.planId,
                    content_type: 'product',
                    currency: link.dataset.currency || 'BRL',
                    value: link.dataset.value ? Number(link.dataset.value) : undefined,
                });
            });
        });
    };

    const initMetaPixelPurchaseTracking = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const shouldTrackPurchase = urlParams.get('meta_event') === 'Purchase' || urlParams.get('purchase') === 'success';

        if (!shouldTrackPurchase) return;

        trackMetaEvent('Purchase', {
            content_name: urlParams.get('plan') || 'DeepStudy assinatura',
            content_type: 'product',
            currency: urlParams.get('currency') || 'BRL',
            value: urlParams.get('value') ? Number(urlParams.get('value')) : undefined,
        });
    };

    initMetaPixelCheckoutTracking();
    initMetaPixelPurchaseTracking();

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
