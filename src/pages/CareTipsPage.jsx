import React from 'react';
import { Header } from '../components/Header';

export function CareTipsPage() {
  return (
    <div className="bg-[#FAF6F0] min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow max-w-4xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center">
        <h1 className="reveal-on-scroll font-serif text-3xl md:text-5xl text-[#2A0845] font-bold mb-6 text-center">
          Jewelry Care Tips
        </h1>
        <p className="reveal-on-scroll reveal-delay-1 text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Keep your pieces shining and beautiful for years to come. Follow these simple care instructions to maintain the quality and brilliance of your jewelry.
        </p>
        
        <div className="reveal-on-scroll-scale reveal-delay-2 w-full bg-white rounded-2xl shadow-xl overflow-hidden p-4 md:p-8 flex justify-center">
          <img 
            src="/images/inst.png" 
            alt="Jewelry Care Instructions" 
            className="max-w-full h-auto rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
