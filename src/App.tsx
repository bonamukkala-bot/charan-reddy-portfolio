/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { useLenis } from './hooks/useLenis';
import { CustomCursor } from './components/ui/CustomCursor';
import { PageLoader } from './components/ui/PageLoader';
import { Navbar } from './components/ui/Navbar';
import { HeroSection } from './components/sections/HeroSection';
import { MarqueeAndProofSection } from './components/sections/MarqueeAndProofSection';
import { FooterSection } from './components/sections/FooterSection';
import { allProjects, Project } from './data/projects';

// Lazy-loaded heavy sections and modals below the fold
const ChatWidget = lazy(() =>
  import('./components/chat/ChatWidget').then((m) => ({ default: m.ChatWidget }))
);
const TwoModesSection = lazy(() =>
  import('./components/sections/TwoModesSection').then((m) => ({ default: m.TwoModesSection }))
);
const StackExplorerSection = lazy(() =>
  import('./components/sections/StackExplorerSection').then((m) => ({ default: m.StackExplorerSection }))
);
const FeaturedWorkSection = lazy(() =>
  import('./components/sections/FeaturedWorkSection').then((m) => ({ default: m.FeaturedWorkSection }))
);
const MoreWorkSection = lazy(() =>
  import('./components/sections/MoreWorkSection').then((m) => ({ default: m.MoreWorkSection }))
);
const ServicesSection = lazy(() =>
  import('./components/sections/ServicesSection').then((m) => ({ default: m.ServicesSection }))
);
const ContentCreatorSection = lazy(() =>
  import('./components/sections/ContentCreatorSection').then((m) => ({ default: m.ContentCreatorSection }))
);
const AboutSection = lazy(() =>
  import('./components/sections/AboutSection').then((m) => ({ default: m.AboutSection }))
);
const ContactSection = lazy(() =>
  import('./components/sections/ContactSection').then((m) => ({ default: m.ContactSection }))
);
const CaseStudyModal = lazy(() =>
  import('./components/ui/CaseStudyModal').then((m) => ({ default: m.CaseStudyModal }))
);
const ProjectInquiryModal = lazy(() =>
  import('./components/ui/ProjectInquiryModal').then((m) => ({ default: m.ProjectInquiryModal }))
);
const CaseStudyPage = lazy(() =>
  import('./pages/CaseStudyPage').then((m) => ({ default: m.CaseStudyPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

// Fallback skeleton placeholder with reserved height to eliminate cumulative layout shift (CLS)
function SectionPlaceholder({ minHeight = '500px' }: { minHeight?: string }) {
  return (
    <div
      style={{ minHeight }}
      className="w-full flex items-center justify-center bg-[#0A0A0B] py-16 border-b border-white/5 opacity-50"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 font-mono text-xs text-[#A1A1AA]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D] animate-ping" />
        <span>Loading section...</span>
      </div>
    </div>
  );
}

// Ready for Vercel Analytics or Web Vitals monitoring:
// import { inject } from '@vercel/analytics';
// inject();

export default function App() {
  // Initialize Lenis smooth scroll
  useLenis();

  const [activeRoute, setActiveRoute] = useState<{
    type: 'home' | 'case-study' | '404';
    slug?: string;
  }>({ type: 'home' });

  const [selectedCaseStudy, setSelectedCaseStudy] = useState<Project | null>(null);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryService, setInquiryService] = useState<string | undefined>(undefined);
  const [isHeroReady, setIsHeroReady] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Prefetch StackExplorerSection and TechSphere during idle time after preloader ends and on scroll
  useEffect(() => {
    if (!isPageLoaded) return;

    const idleCallback =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 100);

    const idleId = idleCallback(() => {
      import('./components/sections/StackExplorerSection').then((m) => {
        if (m.prefetchTechSphere) m.prefetchTechSphere();
      });
    });

    const onScrollNear = () => {
      import('./components/sections/StackExplorerSection').then((m) => {
        if (m.prefetchTechSphere) m.prefetchTechSphere();
      });
      window.removeEventListener('scroll', onScrollNear);
    };
    window.addEventListener('scroll', onScrollNear, { passive: true });

    return () => {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener('scroll', onScrollNear);
    };
  }, [isPageLoaded]);

  // Sync route on mount and browser navigation (popstate)
  useEffect(() => {
    const handleRouteChange = () => {
      const pathname = window.location.pathname;
      if (pathname === '/' || pathname === '') {
        setActiveRoute({ type: 'home' });
      } else if (pathname.startsWith('/work/')) {
        const slug = pathname.replace('/work/', '').replace(/\/$/, '');
        const matched = allProjects.find((p) => p.slug === slug);
        if (matched) {
          setActiveRoute({ type: 'case-study', slug });
          setSelectedCaseStudy(matched);
        } else {
          setActiveRoute({ type: '404' });
        }
      } else {
        setActiveRoute({ type: '404' });
      }
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const navigateToCaseStudy = (project: Project) => {
    window.history.pushState({}, '', `/work/${project.slug}`);
    setSelectedCaseStudy(project);
    setActiveRoute({ type: 'case-study', slug: project.slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setActiveRoute({ type: 'home' });
    setSelectedCaseStudy(null);
  };

  const handleOpenInquiry = (serviceName?: string) => {
    setInquiryService(serviceName);
    setInquiryModalOpen(true);
  };

  const handleExploreWork = () => {
    const workEl = document.getElementById('work');
    if (workEl) {
      workEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If viewing dedicated /work/:slug case study page
  if (activeRoute.type === 'case-study' && selectedCaseStudy) {
    return (
      <div className="relative min-h-screen bg-[#0A0A0B] text-[#F4F4F0] [overflow-x:clip]">
        {/* Skip Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#C6FF3D] focus:text-[#0A0A0B] focus:px-4 focus:py-2 focus:rounded-md font-mono text-xs font-bold"
        >
          Skip to content
        </a>
        <CustomCursor />
        <Navbar onOpenContactModal={() => handleOpenInquiry()} />
        <main id="main-content">
          <Suspense fallback={<SectionPlaceholder minHeight="80vh" />}>
            <CaseStudyPage project={selectedCaseStudy} onBack={navigateToHome} />
          </Suspense>
        </main>
        <FooterSection />
        {inquiryModalOpen && (
          <Suspense fallback={null}>
            <ProjectInquiryModal
              isOpen={inquiryModalOpen}
              onClose={() => setInquiryModalOpen(false)}
              initialService={inquiryService}
            />
          </Suspense>
        )}
      </div>
    );
  }

  // If 404 route
  if (activeRoute.type === '404') {
    return (
      <div className="relative min-h-screen bg-[#0A0A0B] text-[#F4F4F0] [overflow-x:clip]">
        <CustomCursor />
        <Navbar onOpenContactModal={() => handleOpenInquiry()} />
        <main id="main-content">
          <Suspense fallback={<SectionPlaceholder minHeight="80vh" />}>
            <NotFoundPage onGoHome={navigateToHome} />
          </Suspense>
        </main>
        <FooterSection />
      </div>
    );
  }

  // Main Single-Page Portfolio Experience
  return (
    <div className="relative min-h-screen bg-[#0A0A0B] text-[#F4F4F0] [overflow-x:clip] selection:bg-[#C6FF3D] selection:text-[#0A0A0B]">
      {/* Skip Link for Accessibility */}
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#C6FF3D] focus:text-[#0A0A0B] focus:px-4 focus:py-2 focus:rounded-md font-mono text-xs font-bold"
      >
        Skip to content
      </a>

      {/* Premium Full-Screen Page Preloader */}
      {!isPageLoaded && (
        <PageLoader
          onExitStart={() => setIsHeroReady(true)}
          onComplete={() => setIsPageLoaded(true)}
        />
      )}

      {/* Custom Desktop Cursor */}
      <CustomCursor />

      {/* Sticky Navigation */}
      <Navbar
        onOpenContactModal={() => handleOpenInquiry()}
        isReady={isHeroReady}
      />

      <main id="main-content">
        {/* 1. Hero Section */}
        <HeroSection
          onOpenContactModal={() => handleOpenInquiry()}
          onExploreWork={handleExploreWork}
          isReady={isHeroReady}
        />

        {/* 2. Stats Strip & Tech Marquee */}
        <MarqueeAndProofSection />

        {/* Two Modes Split-Screen Section */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="650px" />}>
            <TwoModesSection />
          </Suspense>
        </div>

        {/* Stack Explorer / Technology & System Layers */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="700px" />}>
            <StackExplorerSection />
          </Suspense>
        </div>

        {/* 4. Featured Work (Stacked Case Studies with Real Architecture Diagrams) */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="800px" />}>
            <FeaturedWorkSection onSelectProject={setModalProject} />
          </Suspense>
        </div>

        {/* 5. More Work (Filterable Grid with Visual Headers) */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="600px" />}>
            <MoreWorkSection onSelectProject={setModalProject} />
          </Suspense>
        </div>

        {/* 6. Freelance / Services ("Work with me") */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="600px" />}>
            <ServicesSection onOpenInquiryModal={handleOpenInquiry} />
          </Suspense>
        </div>

        {/* 7. Content Creator ("I teach what I build") */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="700px" />}>
            <ContentCreatorSection />
          </Suspense>
        </div>

        {/* 8. About (Story, Principles, Roadmap) */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="800px" />}>
            <AboutSection />
          </Suspense>
        </div>

        {/* 9. Contact */}
        <div className="content-auto">
          <Suspense fallback={<SectionPlaceholder minHeight="500px" />}>
            <ContactSection onOpenInquiryModal={() => handleOpenInquiry()} />
          </Suspense>
        </div>
      </main>

      {/* 10. Footer */}
      <FooterSection />

      {/* Quick Modal Case Study View */}
      {modalProject && (
        <Suspense fallback={null}>
          <CaseStudyModal
            project={modalProject}
            onClose={() => setModalProject(null)}
            onSelectProject={navigateToCaseStudy}
          />
        </Suspense>
      )}

      {/* Project Inquiry Modal */}
      {inquiryModalOpen && (
        <Suspense fallback={null}>
          <ProjectInquiryModal
            isOpen={inquiryModalOpen}
            onClose={() => setInquiryModalOpen(false)}
            initialService={inquiryService}
          />
        </Suspense>
      )}

      {/* Portfolio RAG Chatbot */}
      <Suspense fallback={null}>
        <ChatWidget isPageLoaded={isPageLoaded} />
      </Suspense>
    </div>
  );
}
