import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import logoImg from '../assets/logo.png';

export function SplashScreen({ onComplete }) {
  const container = useRef(null);
  const logoGroup = useRef(null);
  const fireworks = useRef(null);

  // Safety fallback: guaranteed to dismiss splash after 2 seconds
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
    return () => clearTimeout(safetyTimer);
  }, [onComplete]);

  useGSAP(() => {
    if (!fireworks.current || !logoGroup.current || !container.current) return;

    // Generate firework particles
    const particleCount = 30;
    const colors = ['#D4AF37', '#ffffff', '#FF5733', '#FFC300', '#C6A184'];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1.5 h-1.5 rounded-full';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.top = '50%';
      particle.style.left = '50%';
      particle.style.opacity = '0';
      fireworks.current.appendChild(particle);
    }

    const particles = fireworks.current.childNodes;

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    // Logo appears quickly and crisply
    tl.from(logoGroup.current, {
      scale: 0.85,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out'
    });

    // Fireworks explode
    tl.to(particles, {
      duration: 0.8,
      opacity: 1,
      scale: 'random(1, 1.8)',
      x: () => (Math.random() - 0.5) * window.innerWidth * 0.7,
      y: () => (Math.random() - 0.5) * window.innerHeight * 0.7,
      ease: 'power3.out',
      stagger: { amount: 0.1, from: 'center' }
    }, '-=0.3');

    // Particles fade out
    tl.to(particles, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.inOut'
    }, '-=0.3');

    // Fade everything out smoothly
    tl.to(container.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut'
    }, '+=0.2');

  }, { scope: container });

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[100] bg-[#FAF6F0] flex flex-col items-center justify-center w-full h-full overflow-hidden transition-opacity pointer-events-auto"
      style={{ backgroundColor: '#FAF6F0' }}
    >
      {/* Fireworks container */}
      <div ref={fireworks} className="absolute inset-0 pointer-events-none" />

      {/* Logo container */}
      <div ref={logoGroup} className="relative z-10 flex flex-col items-center justify-center px-4">
        <div className="flex items-center justify-center">
          <img
            src={logoImg}
            alt="LYDIA GLOBAL EXIM Logo"
            className="w-[280px] sm:w-[380px] md:w-[480px] max-w-[90vw] max-h-[60vh] h-auto object-contain mix-blend-multiply"
          />
        </div>
        <div className="flex flex-col items-center text-center mt-3">
          <span className="text-[#45055B] text-xs sm:text-sm md:text-base tracking-[0.2em] font-semibold uppercase font-serif">
            Excellence &{' '}
            <span className="text-[#B38827] font-bold">Premium Quality</span>
          </span>
        </div>
      </div>
    </div>
  );
}
