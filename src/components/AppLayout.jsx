import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Toast } from './Toast';
import { Footer } from './Footer';
import { ScrollRevealProvider } from './ScrollRevealProvider';
import { WhatsAppFloatingButton } from './WhatsAppFloatingButton';

export function AppLayout({ children }) {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Determine if bottom nav should be shown (hidden on cart and checkout)
  const hideBottomNav = ['/checkout', '/cart'].includes(pathname);
  const showBottomNav = !hideBottomNav;

  return (
    <ScrollRevealProvider>
      <div className="min-h-screen bg-gray-100 flex justify-center w-full">
        <div className="w-full md:max-w-full max-w-5xl mx-auto bg-white relative shadow-sm min-h-screen flex flex-col overflow-x-clip">
          <Toast />
          
          {/* Main Content Area */}
          <main className={`flex-grow flex flex-col ${showBottomNav ? 'pb-20 md:pb-0' : 'pb-0'}`}>
            {children}
          </main>
          
          {/* Footer */}
          <Footer />

          {/* Floating WhatsApp Support Button */}
          <WhatsAppFloatingButton />
          
          {/* Bottom Navigation */}
          {showBottomNav && <BottomNav />}
        </div>
      </div>
    </ScrollRevealProvider>
  );
}
