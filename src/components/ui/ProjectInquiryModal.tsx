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

const CONSENT_TEXT =
  "I agree to receive a call from Charan's AI assistant on this number about my inquiry. The call may be recorded and transcribed to help prepare a reply.";

export function ProjectInquiryModal({ isOpen, onClose, initialService }: ProjectInquiryModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: initialService || 'AI Chatbot & Agent',
    budgetRange: '₹30,000 – ₹75,000',
    preferredLanguage: 'en' as 'en' | 'te',
    timeline: 'Within a month',
    message: '',
    consent: false,
    website: '', // honeypot
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
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

  const validateField = (field: string, value: unknown): string => {
    let error = '';
    if (field === 'name') {
      if (!String(value ?? '').trim()) {
        error = 'Your name is required.';
      }
    } else if (field === 'email') {
      const val = String(value ?? '').trim();
      if (!val) {
        error = 'Your email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        error = 'Please enter a valid email address.';
      }
    } else if (field === 'phone') {
      const val = String(value ?? '').trim();
      if (!val) {
        error = 'Phone number is required.';
      } else if (val.length !== 10) {
        error = 'Phone number must be exactly 10 digits.';
      } else if (!/^[6-9]\d{9}$/.test(val)) {
        error = 'Must start with 6, 7, 8, or 9.';
      }
    } else if (field === 'message') {
      const val = String(value ?? '').trim();
      if (!val) {
        error = 'Project overview is required.';
      } else if (val.length < 30) {
        error = `Please write at least 30 characters (${val.length}/30).`;
      }
    } else if (field === 'consent') {
      if (!value) {
        error = 'Consent is required to proceed.';
      }
    }

    setFieldErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    setTouched({
      name: true,
      email: true,
      phone: true,
      message: true,
      consent: true,
    });

    const nameErr = validateField('name', formData.name);
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phone', formData.phone);
    const messageErr = validateField('message', formData.message);
    const consentErr = validateField('consent', formData.consent);

    if (nameErr || emailErr || phoneErr || messageErr || consentErr) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY).');
      }

      const endpoint = `${String(supabaseUrl).replace(/\/$/, '')}/functions/v1/submit-lead`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: `+91${formData.phone.trim()}`,
          project_type: formData.projectType,
          budget: formData.budgetRange,
          timeline: formData.timeline,
          preferred_language: formData.preferredLanguage,
          message: formData.message.trim(),
          consent_given: formData.consent,
          consent_text: CONSENT_TEXT,
          website: formData.website,
        }),
      });

      const data = await res.json().catch(() => ({ ok: false, error: 'Invalid response from server.' }));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Submission failed (status ${res.status}).`);
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error('Lead submission error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setErrorMsg('');
    setFieldErrors({});
    setTouched({});
    setFormData({
      name: '',
      email: '',
      phone: '',
      projectType: 'AI Chatbot & Agent',
      budgetRange: '₹30,000 – ₹75,000',
      preferredLanguage: 'en',
      timeline: 'Within a month',
      message: '',
      consent: false,
      website: '',
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
          <div className="flex-shrink-0 flex items-center justify-between border-b border-white/10 px-5 sm:px-6 py-3.5 sm:py-4 bg-[#141418] pt-[max(0.875rem,env(safe-area-inset-top,0px))] sm:pt-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#C6FF3D]">
                <span>Start a Project</span>
                <span className="text-white/20">·</span>
                <span>{siteConfig.contact.responseSpeed}</span>
              </div>
              <h2 id="inquiry-modal-title" className="font-display text-lg sm:text-2xl font-bold tracking-tight text-[#F4F4F0] mt-0.5">
                Let’s ship something real.
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/10 text-[#A1A1AA] hover:text-white hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF3D] cursor-pointer"
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
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain focus-visible:outline-none px-5 py-5 sm:px-8 space-y-4"
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
                  <div className="mb-4 rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-200 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMsg('')}
                      className="text-[11px] font-mono text-[#C6FF3D] hover:underline shrink-0 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Honeypot field (hidden from view and screen readers) */}
                  <div className="sr-only" aria-hidden="true" style={{ display: 'none' }}>
                    <label htmlFor="inquiry-website">Website</label>
                    <input
                      id="inquiry-website"
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  {/* 1. Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                        Your Name <span className="text-[#C6FF3D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (touched.name) validateField('name', e.target.value);
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, name: true }));
                          validateField('name', formData.name);
                        }}
                        className={`w-full rounded-lg border bg-[#16161A] px-3.5 py-2.5 text-base sm:text-sm text-[#F4F4F0] placeholder-[#8A8A92]/50 focus:outline-none focus:ring-1 ${
                          touched.name && fieldErrors.name
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-white/10 focus:border-[#C6FF3D] focus:ring-[#C6FF3D]'
                        }`}
                      />
                      {touched.name && fieldErrors.name && (
                        <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                        Your Email <span className="text-[#C6FF3D]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="rahul@company.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (touched.email) validateField('email', e.target.value);
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, email: true }));
                          validateField('email', formData.email);
                        }}
                        className={`w-full rounded-lg border bg-[#16161A] px-3.5 py-2.5 text-base sm:text-sm text-[#F4F4F0] placeholder-[#8A8A92]/50 focus:outline-none focus:ring-1 ${
                          touched.email && fieldErrors.email
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-white/10 focus:border-[#C6FF3D] focus:ring-[#C6FF3D]'
                        }`}
                      />
                      {touched.email && fieldErrors.email && (
                        <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* 2. Phone Number (+91 prefix box + 10-digit input) */}
                  <div>
                    <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                      Phone Number <span className="text-[#C6FF3D]">*</span>
                    </label>
                    <div
                      className={`flex rounded-lg border bg-[#16161A] overflow-hidden focus-within:ring-1 ${
                        touched.phone && fieldErrors.phone
                          ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
                          : 'border-white/10 focus-within:border-[#C6FF3D] focus-within:ring-[#C6FF3D]'
                      }`}
                    >
                      <span className="flex items-center justify-center px-3 bg-white/[0.04] border-r border-white/10 font-mono text-xs sm:text-sm text-[#F4F4F0] font-semibold select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="9876543210"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: digits });
                          if (touched.phone) validateField('phone', digits);
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, phone: true }));
                          validateField('phone', formData.phone);
                        }}
                        className="flex-1 bg-transparent px-3.5 py-2.5 text-base sm:text-sm text-[#F4F4F0] placeholder-[#8A8A92]/50 focus:outline-none font-mono tracking-wider"
                      />
                    </div>
                    {touched.phone && fieldErrors.phone ? (
                      <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.phone}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#8A8A92]/70 font-mono">
                        10 digits starting with 6, 7, 8, or 9
                      </p>
                    )}
                  </div>

                  {/* 3. Project Type and Budget Expectation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                        Project Type
                      </label>
                      <select
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-base sm:text-sm text-[#F4F4F0] focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
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
                        className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-base sm:text-sm text-[#F4F4F0] focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                      >
                        <option value="₹15,000 – ₹30,000">₹15,000 – ₹30,000</option>
                        <option value="₹30,000 – ₹75,000">₹30,000 – ₹75,000</option>
                        <option value="₹75,000 – ₹1,50,000">₹75,000 – ₹1,50,000</option>
                        <option value="₹1,50,000+">₹1,50,000+</option>
                        <option value="Flexible / To Discuss">Flexible / To Discuss</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Preferred Call Language */}
                  <div>
                    <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                      Preferred Call Language <span className="text-[#C6FF3D]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredLanguage: 'en' })}
                        className={`min-h-[44px] px-4 py-2.5 rounded-lg border font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          formData.preferredLanguage === 'en'
                            ? 'bg-[#C6FF3D] text-[#0A0A0B] border-[#C6FF3D] shadow-[0_0_12px_rgba(198,255,61,0.25)]'
                            : 'bg-[#16161A] text-[#A1A1AA] border-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span>English</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredLanguage: 'te' })}
                        className={`min-h-[44px] px-4 py-2.5 rounded-lg border font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          formData.preferredLanguage === 'te'
                            ? 'bg-[#C6FF3D] text-[#0A0A0B] border-[#C6FF3D] shadow-[0_0_12px_rgba(198,255,61,0.25)]'
                            : 'bg-[#16161A] text-[#A1A1AA] border-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span>తెలుగు</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Timeline */}
                  <div>
                    <label className="block font-mono text-xs text-[#A1A1AA] mb-1.5">
                      Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#16161A] px-3.5 py-2.5 text-base sm:text-sm text-[#F4F4F0] focus:border-[#C6FF3D] focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                    >
                      <option value="ASAP">ASAP</option>
                      <option value="Within a month">Within a month</option>
                      <option value="1-3 months">1-3 months</option>
                      <option value="Just exploring">Just exploring</option>
                    </select>
                  </div>

                  {/* 6. Project Overview & Goals */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-mono text-xs text-[#A1A1AA]">
                        Project Overview & Goals <span className="text-[#C6FF3D]">*</span>
                      </label>
                      <span
                        className={`font-mono text-[11px] ${
                          formData.message.trim().length >= 30 ? 'text-[#C6FF3D]' : 'text-[#8A8A92]'
                        }`}
                      >
                        {formData.message.trim().length} / 30 chars min
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="What problem are you solving? Who will use it? Any tools you use today?"
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (touched.message) validateField('message', e.target.value);
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, message: true }));
                        validateField('message', formData.message);
                      }}
                      className={`w-full rounded-lg border bg-[#16161A] px-3.5 py-2.5 text-base sm:text-sm text-[#F4F4F0] placeholder-[#8A8A92]/50 focus:outline-none focus:ring-1 ${
                        touched.message && fieldErrors.message
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-white/10 focus:border-[#C6FF3D] focus:ring-[#C6FF3D]'
                      }`}
                    />
                    {touched.message && fieldErrors.message && (
                      <p className="mt-1 text-xs text-red-400 font-mono">{fieldErrors.message}</p>
                    )}
                  </div>

                  {/* 7. Consent Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({ ...formData, consent: checked });
                          if (touched.consent) validateField('consent', checked);
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#16161A] text-[#C6FF3D] accent-[#C6FF3D] focus:ring-[#C6FF3D] focus:ring-offset-0 cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-[#A1A1AA] leading-relaxed group-hover:text-zinc-300 transition-colors select-none">
                        {CONSENT_TEXT} <span className="text-[#C6FF3D]">*</span>
                      </span>
                    </label>
                    {touched.consent && fieldErrors.consent && (
                      <p className="mt-1 text-xs text-red-400 font-mono pl-7">{fieldErrors.consent}</p>
                    )}
                  </div>

                  {/* Submit Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-[#A1A1AA]">
                      {hasWhatsapp ? (
                        <>
                          Prefer WhatsApp?{' '}
                          <a
                            href={`https://wa.me/${siteConfig.contact.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C6FF3D] underline inline-block py-1"
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
                      disabled={isSubmitting || !formData.consent}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#C6FF3D] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0A0A0B] border-t-transparent animate-spin" />
                          <span>Sending inquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Inquiry</span>
                          <Send className="h-3.5 w-3.5" />
                        </>
                      )}
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
                <p className="mt-3 text-sm text-[#A1A1AA] max-w-md leading-relaxed">
                  Got it, <span className="text-[#F4F4F0] font-semibold">{formData.name}</span>. You'll get a call from my AI assistant shortly. If you miss it, I'll reply on email within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-6 rounded-full bg-[#C6FF3D] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors cursor-pointer"
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
