import { ArrowLeft, Home, Terminal } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] bg-grain text-[#F4F4F0] flex flex-col items-center justify-center p-6 selection:bg-[#C6FF3D] selection:text-[#0A0A0B]">
      <div className="relative flex flex-col items-center text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#16161A] text-[#C6FF3D] mb-6 shadow-[0_0_30px_rgba(198,255,61,0.15)]">
          <Terminal className="h-8 w-8" />
        </div>

        <span className="font-mono text-xs uppercase tracking-widest text-[#C6FF3D] mb-2">
          404: Endpoint Not Found
        </span>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F4F0] mb-4">
          Off the Route
        </h1>

        <p className="font-body text-sm text-[#8A8A92] leading-relaxed mb-8">
          The requested system pathway does not exist or has been refactored. Return to the main command center to explore projects, services, and live work.
        </p>

        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 rounded-full bg-[#C6FF3D] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B] hover:bg-[#d4ff66] transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Return to Portfolio</span>
        </button>
      </div>
    </div>
  );
}
