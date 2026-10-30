/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useLenis } from './hooks/useLenis';
import { CustomCursor } from './components/ui/CustomCursor';
import { PageLoader } from './components/ui/PageLoader';
import { Navbar } from './components/ui/Navbar';
import { HeroSection } from './components/sections/HeroSection';
import { MarqueeAndProofSection } from './components/sections/MarqueeAndProofSection';
import { FeaturedWorkSection } from './components/sections/FeaturedWorkSection';
import { MoreWorkSection } from './components/sections/MoreWorkSection';
import { ServicesSection } from './components/sections/ServicesSection';
import { ContentCreatorSection } from './components/sections/ContentCreatorSection';
import { AboutSection } from './components/sections/AboutSection';
import { ContactSection } from './components/sections/ContactSection';
import { FooterSection } from './components/sections/FooterSection';
import { CaseStudyModal } from './components/ui/CaseStudyModal';
import { ProjectInquiryModal } from './components/ui/ProjectInquiryModal';
import { CaseStudyPage } from './pages/CaseStudyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { allProjects, Project } from './data/projects';

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
          <CaseStudyPage project={selectedCaseStudy} onBack={navigateToHome} />
        </main>
        <FooterSection />
        <ProjectInquiryModal
          isOpen={inquiryModalOpen}
          onClose={() => setInquiryModalOpen(false)}
          initialService={inquiryService}
        />
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
          <NotFoundPage onGoHome={navigateToHome} />
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

        {/* 2. Marquee & 3. Proof Strip */}
        <MarqueeAndProofSection />

        {/* 4. Featured Work (Stacked Case Studies with Real Architecture Diagrams) */}
        <FeaturedWorkSection onSelectProject={setModalProject} />

        {/* 5. More Work (Filterable Grid with Visual Headers) */}
        <MoreWorkSection onSelectProject={setModalProject} />

        {/* 6. Freelance / Services ("Work with me") */}
        <ServicesSection onOpenInquiryModal={handleOpenInquiry} />

        {/* 7. Content Creator ("I teach what I build") */}
        <ContentCreatorSection />

        {/* 8. About (Story, Principles, Roadmap) */}
        <AboutSection />

        {/* 9. Contact */}
        <ContactSection onOpenInquiryModal={() => handleOpenInquiry()} />
      </main>

      {/* 10. Footer */}
      <FooterSection />

      {/* Quick Modal Case Study View */}
      <CaseStudyModal
        project={modalProject}
        onClose={() => setModalProject(null)}
        onSelectProject={navigateToCaseStudy}
      />

      {/* Project Inquiry Modal */}
      <ProjectInquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        initialService={inquiryService}
      />
    </div>
  );
}
