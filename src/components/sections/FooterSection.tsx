import { ArrowUp } from 'lucide-react';

export function FooterSection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full bg-[#0A0A0B] py-12 text-[#A1A1AA]">
      <div className="mx-auto max-w-7xl px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Copyright */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-center sm:text-left">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
            className="font-display text-lg font-bold text-[#F4F4F0] hover:text-[#C6FF3D] transition-colors"
          >
            Charan<span className="text-[#C6FF3D]">.</span>
          </a>
          <span className="font-mono text-xs text-[#A1A1AA]">
            © 2026 Charan (Bonamukkala Charan Reddy). All rights reserved.
          </span>
        </div>

        {/* Built by & Back to top */}
        <div className="flex items-center gap-6">
          <span className="font-mono text-xs text-[#A1A1AA]">
            Built by Charan · Hyderabad, IN
          </span>

          <button
            onClick={scrollToTop}
            className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#A1A1AA] hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D]"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
