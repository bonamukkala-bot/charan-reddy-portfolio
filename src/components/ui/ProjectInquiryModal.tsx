import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { siteConfig } from '../../data/site';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ProjectInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

export function ProjectInquiryModal({ isOpen, onClose, initialService }: ProjectInquiryModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: initialService || 'AI Chatbot & Agent',
    budgetRange: '₹30,000 – ₹75,000',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lock body scroll and stop Lenis while inquiry modal is open
  useScrollLock(isOpen);

  useEffect(() => {
    if (initialService) {
      setFormData((prev) => ({ ...prev, projectType: initialService }));
    }
  }, [initialService]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard accessibility and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFormData({
      name: '',
      email: '',
      projectType: 'AI Chatbot & Agent',
      budgetRange: '₹30,000 – ₹75,000',
      message: '',
    });
    onClose();
  };

  const hasWhatsapp = Boolean(siteConfig.contact.whatsappNumber && siteConfig.contact.whatsappNumber.trim() !== '');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A0A0B]/85 backdrop-blur-md"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[calc(100dvh-48px)] w-full max-w-xl overflow-hidden rounded-none sm:rounded-2xl border border-white/10 bg-[#111114] shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-modal-title"
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#141418]">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#C6FF3D]">
                <span>Start a Project</span>
                <span className="text-white/20">·</span>
                <span>{siteConfig.contact.responseSpeed}</span>
              </div>
              <h2 id="inquiry-modal-title" className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F4F4F0] mt-0.5">
                Let’s ship something real.
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            ref={scrollContainerRef}
            tabIndex={0}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain focus-visible:outline-none px-6 py-6 sm:px-8 space-y-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {!isSubmitted ? (
              <div>
                <p className="text-xs text-[#A1A1AA] mb-4">
                  Tell me about your product requirements, scope, and timeline. I review and reply within 24 hours.
                </p>

                {errorMsg && (
                  <div className="mb-4 rounded-lg bg-red-950/40 border border-red-500/30 px-3 py-2 text-xs text-red-200">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                        Your Name <span className="text-[#C6FF3D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-sm text-[#F4F4F0] placeholder-[#8A8A92]/50 focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                        Your Email <span className="text-[#C6FF3D]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="rahul@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-sm text-[#F4F4F0] placeholder-[#8A8A92]/50 focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                        Project Type
                      </label>
                      <select
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-sm text-[#F4F4F0] focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                      >
                        <option value="AI Chatbot & Agent">AI Chatbot & Agent</option>
                        <option value="Business Website / SEO">Business Website / SEO</option>
                        <option value="AI Automation & Dashboards">AI Automation & Dashboards</option>
                        <option value="Full-Stack Web App">Full-Stack Web App</option>
                        <option value="Other Technical Project">Other Technical Project</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                        Budget Expectation
                      </label>
                      <select
                        value={formData.budgetRange}
                        onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-sm text-[#F4F4F0] focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                      >
                        <option value="₹15,000 – ₹30,000">₹15,000 – ₹30,000</option>
                        <option value="₹30,000 – ₹75,000">₹30,000 – ₹75,000</option>
                        <option value="₹75,000 – ₹1,50,000">₹75,000 – ₹1,50,000</option>
                        <option value="₹1,50,000+">₹1,50,000+</option>
                        <option value="Flexible / To Discuss">Flexible / To Discuss</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                      Project Overview & Goals <span className="text-[#C6FF3D]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Briefly describe what you need built, existing systems, and target delivery timeframe..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-sm text-[#F4F4F0] placeholder-[#8A8A92]/50 focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] font-mono text-[#A1A1AA]">
                      {hasWhatsapp ? (
                        <>
                          Prefer WhatsApp?{' '}
                          <a
                            href={`https://wa.me/${siteConfig.contact.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C6FF3D] underline"
                          >
                            Chat directly
                          </a>
                        </>
                      ) : (
                        <span>Email: {siteConfig.contact.email}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-full bg-[#C6FF3D] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Sending...' : 'Send Inquiry'}</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C6FF3D]/15 text-[#C6FF3D] mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#F4F4F0]">
                  Inquiry Received!
                </h3>
                <p className="mt-2 text-sm text-[#A1A1AA] max-w-sm">
                  Thank you, {formData.name}. I have logged your message and will reply to{' '}
                  <span className="text-[#F4F4F0] font-mono">{formData.email}</span> within 24 hours.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-6 rounded-full bg-[#C6FF3D] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
