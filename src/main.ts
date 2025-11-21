import './style.css';

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
            // Ensure it's a valid hash and not just "#"
            if (href && href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                const targetElement = document.querySelector<HTMLElement>(href);
                if (targetElement) {
                    // Respect the scroll-padding-top from CSS for correct offset
                    const scrollPaddingTop = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 100;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - scrollPaddingTop;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if it's open and a link inside it was clicked
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
    onScroll(); // Initial check on load
});
