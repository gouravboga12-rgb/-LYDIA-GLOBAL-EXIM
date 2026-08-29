import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import logoImg from '../assets/logo.png';

export function SplashScreen({ onComplete }) {
  const container = useRef(null);
  const logoGroup = useRef(null);
  const fireworks = useRef(null);

  useGSAP(() => {
    // Generate firework particles
    const particleCount = 40;
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

    // Logo appears
    tl.from(logoGroup.current, {
      scale: 0.5,
      opacity: 0,
      duration: 1,
      ease: 'back.out(1.7)'
    });

    // Fireworks explode
    tl.to(particles, {
      duration: 1.5,
      opacity: 1,
      scale: 'random(1, 2)',
      x: () => (Math.random() - 0.5) * window.innerWidth * 0.8,
      y: () => (Math.random() - 0.5) * window.innerHeight * 0.8,
      ease: 'power4.out',
      stagger: {
        amount: 0.2,
        from: 'center'
      }
    }, '-=0.5');

    // Particles fade out
    tl.to(particles, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut'
    }, '-=0.5');

    // Gentle floating effect for logo
    tl.to(logoGroup.current, {
      y: -15,
      duration: 1.5,
      yoyo: true,
      repeat: 1,
      ease: 'sine.inOut'
    }, '-=2.0');

    // Fade everything out
    tl.to(container.current, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '+=0.5');

  }, { scope: container });

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[100] bg-[#FAF6F0] flex flex-col items-center justify-center w-full h-full overflow-hidden"
    >
      {/* Fireworks container */}
      <div ref={fireworks} className="absolute inset-0 pointer-events-none" />

      {/* Logo container */}
      <div ref={logoGroup} className="relative z-10 flex flex-col items-center justify-center px-4">
        <div className="flex items-center justify-center mb-4">
          <img
            src={logoImg}
            alt="LYDIA GLOBAL EXIM Logo"
            className="w-48 md:w-64 max-w-[80vw] h-auto object-contain drop-shadow-md"
          />
        </div>
        <div className="flex flex-col items-center text-center mt-2">
          <span className="text-[#2A0845] text-sm md:text-base tracking-[0.15em] font-semibold" style={{ fontFamily: 'serif', letterSpacing: '0.12em' }}>
            Excellence &{' '}
            <span className="text-[#B38827] font-bold">Premium Quality</span>
          </span>
        </div>
      </div>
    </div>
  );
}
