import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { TerminalScrollBar } from './TerminalScrollBar';

interface NavbarProps {
  onOpenContactModal: () => void;
  isReady?: boolean;
}

const navItems = [
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Content', href: '#content' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar({ onOpenContactModal, isReady = true }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock scroll when mobile menu is open
  useScrollLock(mobileMenuOpen);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const currentScrollY = window.scrollY;

          // Navbar elevation
          setScrolled(currentScrollY > 40);

          // Hide on scroll down, reveal on scroll up
          if (currentScrollY > 140 && currentScrollY > lastScrollY && !mobileMenuOpen) {
            setHidden(true);
          } else {
            setHidden(false);
          }
          setLastScrollY(currentScrollY);

          // Section spy: If near the top (in hero), clear active section
          if (currentScrollY < 320) {
            setActiveSection('');
            return;
          }

          const sections = ['work', 'services', 'content', 'about', 'contact'];
          for (const sectionId of sections) {
            const el = document.getElementById(sectionId);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 240 && rect.bottom >= 240) {
                setActiveSection(sectionId);
                break;
              }
            }
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, mobileMenuOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const scrollToAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Terminal-Style Scroll Progress Bar */}
      <TerminalScrollBar isReady={isReady} />

      {/* Main Sticky Header (offset below TerminalScrollBar) */}
      <header
        className={`fixed top-[22px] md:top-[34px] left-0 right-0 z-50 transition-all duration-500 ease-out ${
          !isReady
            ? '-translate-y-[calc(100%+34px)] opacity-0 pointer-events-none'
            : hidden
            ? '-translate-y-[calc(100%+34px)] opacity-100'
            : 'translate-y-0 opacity-100'
        } ${
          scrolled
            ? 'bg-[#0A0A0B]/95 sm:bg-[#0A0A0B]/85 sm:backdrop-blur-md border-b border-white/5 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 md:px-10">
          {/* Brand Wordmark */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center font-display text-xl font-bold tracking-tight text-[#F4F4F0] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
            aria-label="Charan homepage"
          >
            <span>Charan</span>
            <span className="text-[#C6FF3D] transition-transform duration-200 group-hover:scale-125">.</span>
          </a>

          {/* Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A1A1AA]"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => {
              const isActive = activeSection === item.href.replace('#', '');
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => scrollToAnchor(e, item.href)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-200 hover:text-[#F4F4F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] ${
                    isActive ? 'text-[#F4F4F0] font-semibold' : ''
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="navActiveIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#C6FF3D]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* CTA Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenContactModal}
              className="relative hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-[#C6FF3D] px-5 py-2 text-xs font-semibold tracking-wide text-[#0A0A0B] uppercase transition-all duration-200 hover:bg-[#d4ff66] hover:shadow-[0_0_20px_rgba(198,255,61,0.35)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] whitespace-nowrap shrink-0"
            >
              <span>Hire me</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[#F4F4F0] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Menu with useScrollLock & data-lenis-prevent */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto overscroll-contain bg-[#0A0A0B] px-8 pt-24 pb-12 md:hidden"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            <div className="flex flex-col gap-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[#A1A1AA]">Navigation</span>
              <div className="flex flex-col gap-4">
                {navItems.map((item, idx) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => scrollToAnchor(e, item.href)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * idx, duration: 0.25 }}
                    className="font-display text-3xl font-bold tracking-tight text-[#F4F4F0] hover:text-[#C6FF3D] transition-colors"
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-white/10 mt-6">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenContactModal();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C6FF3D] py-3.5 text-sm font-semibold tracking-wide text-[#0A0A0B] uppercase shadow-[0_0_20px_rgba(198,255,61,0.3)]"
              >
                <span>Hire me / Start a Project</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <div className="flex justify-between font-mono text-xs text-[#A1A1AA]">
                <span>Hyderabad, IN (IST)</span>
                <span>bonamukkalacharan@gmail.com</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
