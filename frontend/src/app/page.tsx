"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaqAccordion } from "@/components/FaqAccordion";

const TABS = ["Overview", "Students", "Teachers", "Attendance", "AI Assistant"];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % TABS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Navbar */}
      <nav className="w-full px-8 py-5 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
            <span className="text-white font-bold text-sm tracking-widest">V</span>
          </div>
          <span className="text-lg font-bold tracking-tight">Village AI Nexus</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="#features" className="hover:text-black transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-black transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-black transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-black transition-colors">FAQ</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium hover:text-gray-600 transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center overflow-x-hidden">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center justify-center pt-32 pb-24 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 mb-10">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            Introducing Village AI Nexus 2.0
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-6xl md:text-8xl font-bold tracking-tighter text-black leading-[1.05] max-w-5xl mx-auto">
            Manage Schools.<br />
            Track Every Student.<br />
            All From One Platform.
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            The premium enterprise platform for school management, intelligent AI student assistants, secure role-based access, and real-time operations analytics.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
            <Link href="/login" className="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-all flex items-center gap-2">
              Get Started Free <span>→</span>
            </Link>
            <Link href="#contact" className="px-8 py-4 bg-white text-black border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-all">
              Talk to Sales
            </Link>
          </motion.div>
        </section>

        {/* Dashboard Preview Interface */}
        <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.4 }} className="w-full max-w-6xl mx-auto px-4 pb-32">
          <div className="w-full aspect-[16/9] bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/5 overflow-hidden flex flex-col">
            <div className="w-full h-12 border-b border-gray-100 flex items-center px-4 gap-2 bg-gray-50/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              </div>
              <div className="mx-auto h-6 w-64 bg-white border border-gray-200 rounded text-[10px] text-gray-400 flex items-center justify-center font-mono">
                nexus.villageai.com/dashboard
              </div>
            </div>
            <div className="flex-1 flex bg-white text-left">
              {/* Sidebar */}
              <div className="w-64 border-r border-gray-100 p-6 flex flex-col gap-2">
                <div className="font-bold text-lg mb-6 tracking-tight">Village AI</div>
                {TABS.map((tab, idx) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
                      activeTab === idx
                        ? "bg-gray-100 text-black"
                        : "text-gray-500 hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {/* Main Content */}
              <div className="flex-1 bg-gray-50/30 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-8 flex flex-col gap-6 h-full"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {activeTab === 0 && "School Overview"}
                        {activeTab === 1 && "Student Directory"}
                        {activeTab === 2 && "Teacher Profiles"}
                        {activeTab === 3 && "Attendance Workflows"}
                        {activeTab === 4 && "AI Assistant"}
                      </h2>
                      <div className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white">This Week ▼</div>
                    </div>
                    
                    {activeTab === 0 && (
                      <>
                        <div className="grid grid-cols-3 gap-6">
                          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                            <div className="text-sm text-gray-500 font-medium mb-2">Total Students</div>
                            <div className="text-3xl font-bold text-black mb-2">1,420</div>
                            <div className="inline-flex items-center px-2 py-1 rounded bg-black text-white text-xs font-bold">+12%</div>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                            <div className="text-sm text-gray-500 font-medium mb-2">Active Teachers</div>
                            <div className="text-3xl font-bold text-black mb-2">85</div>
                            <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold">Stable</div>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                            <div className="text-sm text-gray-500 font-medium mb-2">Avg. Attendance</div>
                            <div className="text-3xl font-bold text-black mb-2">96.4%</div>
                            <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold">-0.2%</div>
                          </div>
                        </div>
                        
                        <div className="w-full flex-1 bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col">
                          <h3 className="text-sm font-bold text-gray-900 mb-6">Recent Activity</h3>
                          <div className="flex-1 flex flex-col gap-4">
                            {[
                              { name: "Sarah Jenkins", action: "Updated attendance for Class 10A", time: "10 mins ago" },
                              { name: "Dr. Robert Chen", action: "Exported monthly reports", time: "1 hour ago" },
                              { name: "System AI", action: "Answered 45 student curriculum queries", time: "2 hours ago" },
                              { name: "Emily Watson", action: "Added 3 new teacher profiles", time: "5 hours ago" }
                            ].map((row, i) => (
                              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {row.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-black">{row.name}</p>
                                    <p className="text-xs text-gray-500">{row.action}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">{row.time}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {activeTab === 1 && (
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl flex flex-col p-6 shadow-sm">
                        <div className="w-full h-12 bg-gray-50 rounded-lg mb-4 flex items-center px-4"><div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-2"></div><div className="w-32 h-2 bg-gray-200 rounded"></div></div>
                        <div className="flex-1 border border-gray-100 rounded-lg bg-gray-50/50 flex items-center justify-center text-sm font-medium text-gray-400">Student Profiles & Enrollment Data</div>
                      </div>
                    )}
                    {activeTab === 2 && (
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl flex flex-col p-6 shadow-sm">
                         <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="border border-gray-100 bg-gray-50/50 rounded-xl flex items-center justify-center flex-col gap-2"><div className="w-16 h-16 rounded-full bg-gray-200"></div><div className="w-24 h-2 bg-gray-300 rounded"></div></div>
                            <div className="border border-gray-100 bg-gray-50/50 rounded-xl flex items-center justify-center flex-col gap-2"><div className="w-16 h-16 rounded-full bg-gray-200"></div><div className="w-24 h-2 bg-gray-300 rounded"></div></div>
                         </div>
                      </div>
                    )}
                    {activeTab === 3 && (
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl flex flex-col p-6 shadow-sm">
                        <div className="flex gap-4 mb-6">
                           <div className="flex-1 h-24 bg-red-50 rounded-xl flex items-center justify-center text-red-500 font-bold">Absences: 12</div>
                           <div className="flex-1 h-24 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-bold">Present: 345</div>
                        </div>
                        <div className="flex-1 border border-gray-100 rounded-lg bg-gray-50/50 flex items-center justify-center text-sm font-medium text-gray-400">Weekly Attendance Trend</div>
                      </div>
                    )}
                    {activeTab === 4 && (
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl flex flex-col p-6 shadow-sm overflow-hidden">
                         <div className="flex-1 overflow-hidden flex flex-col gap-4">
                            <div className="self-end max-w-[80%] bg-black text-white p-3 rounded-2xl rounded-tr-sm text-sm">Can you explain photosynthesis?</div>
                            <div className="self-start max-w-[80%] bg-gray-100 text-black p-3 rounded-2xl rounded-tl-sm text-sm">Sure! Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.</div>
                         </div>
                         <div className="mt-4 h-12 rounded-full border border-gray-200 flex items-center px-4 text-sm text-gray-400">Ask the AI Assistant...</div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section id="features" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }} className="w-full bg-black text-white py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Built for Modern Educational Infrastructure</h2>
              <p className="text-gray-400 text-lg">Every tool you need to manage your institution, entirely integrated and accessible from a single minimalist dashboard.</p>
            </div>
            
            <motion.div variants={{hidden: {opacity: 0}, show: {opacity: 1, transition: {staggerChildren: 0.1}}}} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                { title: "AI Student Assistant", description: "A 24/7 personalized learning companion. Our AI retains conversational context and provides curriculum-aligned support securely." },
                { title: "Strict Tenant Isolation", description: "Enterprise-grade data security. Multi-tenant architecture guarantees complete isolation of school records and user profiles." },
                { title: "Granular RBAC", description: "Role-Based Access Control mapped perfectly to your hierarchy. Distinct experiences for Super Admins, School Admins, Teachers, and Students." },
                { title: "Attendance Workflows", description: "Frictionless daily attendance tracking restricted precisely by teacher-class authorizations." },
                { title: "Intelligent Analytics", description: "Targeted dashboards offering actionable, real-time insights tailored strictly to the clearance level of the active user." },
                { title: "Developer First API", description: "Built on FastAPI. Extensible, fully documented endpoints ready for custom integrations and future scale." }
              ].map((feature, i) => (
                <motion.div key={i} variants={{hidden: {opacity: 0, y: 20}, show: {opacity: 1, y: 0}}} className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black font-bold text-xl">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section id="how-it-works" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }} className="w-full py-32 px-4 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-6">How Village AI Nexus Works</h2>
              <p className="text-gray-500 text-lg">Streamline your entire school&apos;s operations in three simple steps.</p>
            </div>
            <motion.div variants={{hidden: {opacity: 0}, show: {opacity: 1, transition: {staggerChildren: 0.1}}}} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { title: "Deploy & Onboard", description: "Instantly provision your secure tenant workspace and automatically import your student and teacher rosters." },
                { title: "Assign & Manage", description: "Allocate teachers to classes, establish RBAC permissions, and streamline your daily operational workflows." },
                { title: "Analyze & Empower", description: "Empower students with AI assistants and gain real-time insights through specialized administrative dashboards." }
              ].map((step, i) => (
                <motion.div key={i} variants={{hidden: {opacity: 0, y: 20}, show: {opacity: 1, y: 0}}} className="flex flex-col gap-4">
                  <div className="text-7xl font-bold text-gray-100 mb-2">0{i + 1}</div>
                  <h3 className="text-2xl font-semibold tracking-tight text-black">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section id="testimonials" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }} className="w-full py-32 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-16 text-center">Trusted by Forward-Thinking Schools</h2>
             <motion.div variants={{hidden: {opacity: 0}, show: {opacity: 1, transition: {staggerChildren: 0.1}}}} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { quote: "Nexus entirely eliminated our administrative overhead. The AI assistant has measurably improved student engagement.", name: "Sarah Jenkins", role: "Principal, Westfield High" },
                  { quote: "The role-based access control and tenant isolation gave us the enterprise security guarantees we strictly required.", name: "Dr. Robert Chen", role: "Superintendent, Valley District" },
                  { quote: "Minimalist, extremely fast, and incredibly reliable. This is how educational software was meant to be built.", name: "Emily Watson", role: "IT Director, Summit Academy" }
                ].map((testimonial, i) => (
                  <motion.div key={i} variants={{hidden: {opacity: 0, y: 20}, show: {opacity: 1, y: 0}}} className="p-8 bg-white border border-gray-200 rounded-2xl flex flex-col justify-between">
                    <p className="text-gray-600 italic mb-8">&quot;{testimonial.quote}&quot;</p>
                    <div>
                      <p className="font-bold text-black">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </motion.div>
                ))}
             </motion.div>
          </div>
        </motion.section>

        {/* Pricing */}
        <motion.section id="pricing" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }} className="w-full py-32 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-16 text-center">Simple, Transparent Pricing</h2>
            <motion.div variants={{hidden: {opacity: 0}, show: {opacity: 1, transition: {staggerChildren: 0.1}}}} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
               <motion.div variants={{hidden: {opacity: 0, y: 20}, show: {opacity: 1, y: 0}}} className="p-10 border border-gray-200 rounded-3xl bg-white text-center">
                  <h3 className="text-xl font-bold mb-2">Starter</h3>
                  <p className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400 font-normal">/mo</span></p>
                  <p className="text-sm text-gray-500 mb-8">Perfect for small private schools.</p>
                  <Link href="/login" className="block w-full py-3 rounded-full border border-gray-200 font-medium hover:bg-gray-50 transition-colors">Get Started</Link>
               </motion.div>
               <motion.div variants={{hidden: {opacity: 0, y: 20}, show: {opacity: 1, y: 0}}} className="p-10 border border-black rounded-3xl bg-black text-white text-center transform scale-105 shadow-xl">
                  <h3 className="text-xl font-bold mb-2">Professional</h3>
                  <p className="text-4xl font-bold mb-6">$299<span className="text-lg text-gray-400 font-normal">/mo</span></p>
                  <p className="text-sm text-gray-400 mb-8">For growing school districts.</p>
                  <Link href="/login" className="block w-full py-3 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors">Start Free Trial</Link>
               </motion.div>
               <motion.div variants={{hidden: {opacity: 0, y: 20}, show: {opacity: 1, y: 0}}} className="p-10 border border-gray-200 rounded-3xl bg-white text-center">
                  <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                  <p className="text-4xl font-bold mb-6">Custom</p>
                  <p className="text-sm text-gray-500 mb-8">Dedicated infrastructure & support.</p>
                  <Link href="#contact" className="block w-full py-3 rounded-full border border-gray-200 font-medium hover:bg-gray-50 transition-colors">Contact Sales</Link>
               </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section id="faq" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }} className="w-full py-32 px-4 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-16 text-center">Frequently Asked Questions</h2>
            <FaqAccordion />
          </div>
        </motion.section>

        {/* Value Proposition */}
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8 }} className="w-full py-32 px-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-8">Scale Your Institution Without Friction</h2>
            <p className="text-xl text-gray-600 mb-12">
              Join leading forward-thinking schools that have simplified their operations, secured their data, and empowered their students with Village AI Nexus.
            </p>
            <Link href="/login" className="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all inline-flex items-center gap-2">
              Start Your Free Trial
            </Link>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-12 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
              <span className="text-white font-bold text-xs tracking-widest">V</span>
            </div>
            <span className="text-sm font-bold tracking-tight">Village AI Nexus</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-black transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-black transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-gray-400">© 2026 Village AI Nexus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
