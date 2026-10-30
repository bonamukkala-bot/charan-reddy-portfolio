import { motion } from 'motion/react';
import { ArrowUpRight, Bot, Globe, BarChart3, Check, Clock, Sparkles } from 'lucide-react';
import { servicesData, processSteps, serviceMeta } from '../../data/services';
import { siteConfig } from '../../data/site';

interface ServicesSectionProps {
  onOpenInquiryModal: (serviceName?: string) => void;
}

export function ServicesSection({ onOpenInquiryModal }: ServicesSectionProps) {
  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'ai-agents-chatbots':
        return <Bot className="h-6 w-6 text-[#C6FF3D]" />;
      case 'business-websites':
        return <Globe className="h-6 w-6 text-[#C6FF3D]" />;
      case 'ai-automation-dashboards':
        return <BarChart3 className="h-6 w-6 text-[#C6FF3D]" />;
      default:
        return <Sparkles className="h-6 w-6 text-[#C6FF3D]" />;
    }
  };

  return (
    <section id="services" className="relative w-full bg-[#0A0A0B] py-24 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#A1A1AA] mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
              <span>Work With Me</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F4F4F0] max-w-xl">
              Need something built? <span className="text-[#C6FF3D]">Let’s ship it.</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-[#A1A1AA]">
              <Clock className="h-3.5 w-3.5 text-[#C6FF3D]" />
              <span>{siteConfig.contact.responseSpeed}</span>
            </div>
            <button
              onClick={() => onOpenInquiryModal()}
              className="inline-flex items-center gap-2 rounded-full bg-[#C6FF3D] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#d4ff66] hover:shadow-[0_0_24px_rgba(198,255,61,0.35)] active:scale-95 transition-all"
            >
              <span>Start a project</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3 Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {servicesData.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111114] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C6FF3D]/50 hover:shadow-[0_12px_36px_rgba(198,255,61,0.12)]"
            >
              <div>
                {/* Number & Icon */}
                <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-[#C6FF3D]/40 transition-colors">
                    {getServiceIcon(service.id)}
                  </div>
                  <span className="font-display text-3xl font-bold text-white/20 group-hover:text-[#C6FF3D] transition-colors">
                    {service.number}
                  </span>
                </div>

                {/* Title & Tagline */}
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F4F0] group-hover:text-[#C6FF3D] transition-colors">
                  {service.title}
                </h3>
                <p className="mt-2 text-xs font-mono text-[#C6FF3D]/90">
                  {service.tagline}
                </p>

                {/* Description */}
                <p className="mt-4 font-body text-sm text-[#A1A1AA] leading-relaxed">
                  {service.description}
                </p>

                {/* Deliverables List */}
                <div className="mt-6 space-y-2.5 pt-4 border-t border-white/5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#A1A1AA] block">
                    What’s Included:
                  </span>
                  {service.deliverables.map((item, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-2 text-xs text-[#F4F4F0]/90">
                      <Check className="h-3.5 w-3.5 text-[#C6FF3D] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#A1A1AA] truncate max-w-[170px]">
                  {service.idealFor}
                </span>
                <button
                  onClick={() => onOpenInquiryModal(service.title)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase text-[#C6FF3D] hover:underline"
                >
                  <span>Inquire</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3-Step Process Timeline: "How I Go From Idea to Production" (First Person) */}
        <div className="rounded-2xl border border-white/10 bg-[#111114] p-8 sm:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#C6FF3D]">
                Transparent Workflow
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F4F0] mt-1">
                How I Go From Idea to Production
              </h3>
            </div>
            <span className="font-mono text-xs text-[#A1A1AA]">
              {serviceMeta.turnaroundNote}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {processSteps.map((step, sIdx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: sIdx * 0.12 }}
                className="relative flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-2xl font-bold text-[#C6FF3D]">
                    {step.number}
                  </span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="font-mono text-[11px] text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded">
                    {step.timeframe}
                  </span>
                </div>

                <h4 className="font-display text-lg font-bold text-[#F4F4F0]">
                  {step.title}
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
