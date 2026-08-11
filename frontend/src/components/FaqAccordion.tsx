"use client";

import { useState } from "react";

const faqs = [
  { q: "How does the AI Student Assistant work?", a: "The AI leverages advanced language models (e.g., OpenAI) configured via our backend Provider pattern. It retains conversational context within a secure session to help students with curriculum-aligned questions." },
  { q: "Is our school's data completely isolated?", a: "Yes. Our multi-tenant architecture implements strict data isolation at the repository level. User queries are explicitly bound to their authenticated school ID, preventing any cross-tenant data leaks." },
  { q: "Can teachers only see their assigned classes?", a: "Exactly. The platform features granular Role-Based Access Control (RBAC). Teachers are implicitly scoped to view only the classes they have been explicitly assigned to manage." },
  { q: "Do you offer custom API integrations?", a: "Our backend is built on FastAPI, offering a fully documented, robust REST API that can seamlessly integrate with your existing legacy systems or specialized software." }
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col w-full">
      {faqs.map((faq, i) => (
        <div key={i} className="border-b border-gray-200">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
          >
            <h4 className="text-lg font-semibold text-black group-hover:text-gray-700 transition-colors">{faq.q}</h4>
            <span 
              className={`transform transition-transform duration-300 ml-4 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 ${openIndex === i ? 'rotate-180 bg-gray-50' : 'bg-white'}`}
            >
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          <div 
            className={`grid transition-all duration-300 ease-in-out ${openIndex === i ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <p className="text-gray-600 leading-relaxed pr-12">{faq.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
