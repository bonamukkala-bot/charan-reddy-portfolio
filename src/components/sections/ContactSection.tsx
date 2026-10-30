import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, MessageCircle, Github, Linkedin, Instagram, Youtube, ArrowUpRight, Clock, Mail } from 'lucide-react';
import { siteConfig } from '../../data/site';
import { socialLinks } from '../../data/socials';

interface ContactSectionProps {
  onOpenInquiryModal: () => void;
}

export function ContactSection({ onOpenInquiryModal }: ContactSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(siteConfig.contact.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const hasWhatsapp = Boolean(siteConfig.contact.whatsappNumber && siteConfig.contact.whatsappNumber.trim() !== '');
  const whatsappUrl = hasWhatsapp
    ? `https://wa.me/${siteConfig.contact.whatsappNumber}?text=Hi%20Charan,%20I%20would%20like%20to%20discuss%20a%20project`
    : '';

  return (
    <section id="contact" className="relative w-full bg-[#0A0A0B] py-24 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: 7 Cols */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
              <span>Get In Touch</span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F4F4F0] leading-none mb-6">
              Let’s build <br />
              <span className="text-[#C6FF3D]">something real.</span>
            </h2>

            <p className="font-body text-base sm:text-lg text-[#A1A1AA] max-w-xl leading-relaxed mb-8">
              Whether you need a multi-agent system, deterministic data diagnostic software, a high-converting web application, or want to discuss AI/ML roles in India: my inbox is open.
            </p>

            {/* Email Address with Copy Button */}
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111114] p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#A1A1AA] uppercase block mb-1">
                  Direct Email
                </span>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-mono text-base sm:text-lg font-semibold text-[#F4F4F0] hover:text-[#C6FF3D] transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-mono text-[#F4F4F0] hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors"
                  aria-label="Copy email address"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[#C6FF3D]" />
                      <span className="text-[#C6FF3D]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-[#C6FF3D] text-[#0A0A0B] hover:bg-[#d4ff66] transition-colors"
                  aria-label="Send email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Response Time Indicator */}
            <div className="flex items-center gap-2 font-mono text-xs text-[#A1A1AA] mb-8">
              <Clock className="h-4 w-4 text-[#C6FF3D]" />
              <span>{siteConfig.contact.responseSpeed}</span>
            </div>

            {/* Action Buttons: WhatsApp ONLY rendered if number is set */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <button
                onClick={onOpenInquiryModal}
                className="inline-flex items-center gap-2 rounded-full bg-[#C6FF3D] px-7 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#d4ff66] shadow-[0_0_25px_rgba(198,255,61,0.3)] transition-all"
              >
                <span>Project Inquiry Form</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>

              {hasWhatsapp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F4F4F0] hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-all"
                >
                  <MessageCircle className="h-4 w-4 text-[#C6FF3D]" />
                  <span>WhatsApp Quick Chat</span>
                </a>
              )}
            </div>

            {/* Social Links Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-6 border-t border-white/10 w-full">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 font-mono text-xs text-[#A1A1AA] hover:border-[#C6FF3D]/40 hover:text-white transition-colors"
                >
                  {s.name.includes('GitHub') && <Github className="h-3.5 w-3.5" />}
                  {s.name.includes('LinkedIn') && <Linkedin className="h-3.5 w-3.5" />}
                  {s.name.includes('Instagram') && <Instagram className="h-3.5 w-3.5" />}
                  {s.name.includes('YouTube') && <Youtube className="h-3.5 w-3.5 text-red-400" />}
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Right Column: 5 Cols - charan-contact.jpg with dark gradient behind caption */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-[#16161A] shadow-2xl"
            >
              <img
                src="/images/charan-contact.jpg"
                alt="Charan (Bonamukkala Charan Reddy) in light blue shirt"
                className="h-full w-full object-cover object-center filter contrast-105"
                loading="lazy"
                decoding="async"
                width="500"
                height="680"
              />
              {/* High-contrast gradient to make Availability caption crystal clear */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent pointer-events-none" />

              <div className="absolute bottom-6 left-6 right-6 z-10 text-center">
                <span className="font-mono text-xs text-[#C6FF3D] uppercase tracking-wider block mb-1">
                  Availability
                </span>
                <p className="font-display text-sm font-bold text-[#F4F4F0] leading-snug">
                  Open for freelance projects, AI contracts & engineering roles
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
