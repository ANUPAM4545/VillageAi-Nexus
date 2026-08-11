import Link from "next/link";
import { FaqAccordion } from "@/components/FaqAccordion";

export default function Home() {
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

      <main className="flex-grow flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center justify-center pt-32 pb-24 px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 mb-10">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            Introducing Village AI Nexus 2.0
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-black leading-[1.05] max-w-5xl mx-auto">
            Manage Schools.<br />
            Track Every Student.<br />
            All From One Platform.
          </h1>
          
          <p className="mt-8 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            The premium enterprise platform for school management, intelligent AI student assistants, secure role-based access, and real-time operations analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
            <Link href="/login" className="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-all flex items-center gap-2">
              Get Started Free <span>→</span>
            </Link>
            <Link href="#contact" className="px-8 py-4 bg-white text-black border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-all">
              Talk to Sales
            </Link>
          </div>
        </section>

        {/* Dashboard Preview Interface */}
        <section className="w-full max-w-6xl mx-auto px-4 pb-32">
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
                <div className="w-full px-3 py-2 bg-gray-100 text-sm font-medium rounded-lg text-black">Overview</div>
                <div className="w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">Students</div>
                <div className="w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">Teachers</div>
                <div className="w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">Attendance</div>
                <div className="w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">AI Assistant</div>
              </div>
              {/* Main Content */}
              <div className="flex-1 p-8 flex flex-col gap-6 bg-gray-50/30">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold tracking-tight">School Overview</h2>
                  <div className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white">This Week ▼</div>
                </div>
                
                {/* Stats Cards */}
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
                
                {/* Large Chart/Table Placeholder */}
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
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-black text-white py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Built for Modern Educational Infrastructure</h2>
              <p className="text-gray-400 text-lg">Every tool you need to manage your institution, entirely integrated and accessible from a single minimalist dashboard.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                { title: "AI Student Assistant", description: "A 24/7 personalized learning companion. Our AI retains conversational context and provides curriculum-aligned support securely." },
                { title: "Strict Tenant Isolation", description: "Enterprise-grade data security. Multi-tenant architecture guarantees complete isolation of school records and user profiles." },
                { title: "Granular RBAC", description: "Role-Based Access Control mapped perfectly to your hierarchy. Distinct experiences for Super Admins, School Admins, Teachers, and Students." },
                { title: "Attendance Workflows", description: "Frictionless daily attendance tracking restricted precisely by teacher-class authorizations." },
                { title: "Intelligent Analytics", description: "Targeted dashboards offering actionable, real-time insights tailored strictly to the clearance level of the active user." },
                { title: "Developer First API", description: "Built on FastAPI. Extensible, fully documented endpoints ready for custom integrations and future scale." }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black font-bold text-xl">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-32 px-4 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-6">How Village AI Nexus Works</h2>
              <p className="text-gray-500 text-lg">Streamline your entire school&apos;s operations in three simple steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { title: "Deploy & Onboard", description: "Instantly provision your secure tenant workspace and automatically import your student and teacher rosters." },
                { title: "Assign & Manage", description: "Allocate teachers to classes, establish RBAC permissions, and streamline your daily operational workflows." },
                { title: "Analyze & Empower", description: "Empower students with AI assistants and gain real-time insights through specialized administrative dashboards." }
              ].map((step, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="text-7xl font-bold text-gray-100 mb-2">0{i + 1}</div>
                  <h3 className="text-2xl font-semibold tracking-tight text-black">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="w-full py-32 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
             <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-16 text-center">Trusted by Forward-Thinking Schools</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { quote: "Nexus entirely eliminated our administrative overhead. The AI assistant has measurably improved student engagement.", name: "Sarah Jenkins", role: "Principal, Westfield High" },
                  { quote: "The role-based access control and tenant isolation gave us the enterprise security guarantees we strictly required.", name: "Dr. Robert Chen", role: "Superintendent, Valley District" },
                  { quote: "Minimalist, extremely fast, and incredibly reliable. This is how educational software was meant to be built.", name: "Emily Watson", role: "IT Director, Summit Academy" }
                ].map((testimonial, i) => (
                  <div key={i} className="p-8 bg-white border border-gray-200 rounded-2xl flex flex-col justify-between">
                    <p className="text-gray-600 italic mb-8">&quot;{testimonial.quote}&quot;</p>
                    <div>
                      <p className="font-bold text-black">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="w-full py-32 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-16 text-center">Simple, Transparent Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
               <div className="p-10 border border-gray-200 rounded-3xl bg-white text-center">
                  <h3 className="text-xl font-bold mb-2">Starter</h3>
                  <p className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400 font-normal">/mo</span></p>
                  <p className="text-sm text-gray-500 mb-8">Perfect for small private schools.</p>
                  <Link href="/login" className="block w-full py-3 rounded-full border border-gray-200 font-medium hover:bg-gray-50 transition-colors">Get Started</Link>
               </div>
               <div className="p-10 border border-black rounded-3xl bg-black text-white text-center transform scale-105 shadow-xl">
                  <h3 className="text-xl font-bold mb-2">Professional</h3>
                  <p className="text-4xl font-bold mb-6">$299<span className="text-lg text-gray-400 font-normal">/mo</span></p>
                  <p className="text-sm text-gray-400 mb-8">For growing school districts.</p>
                  <Link href="/login" className="block w-full py-3 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors">Start Free Trial</Link>
               </div>
               <div className="p-10 border border-gray-200 rounded-3xl bg-white text-center">
                  <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                  <p className="text-4xl font-bold mb-6">Custom</p>
                  <p className="text-sm text-gray-500 mb-8">Dedicated infrastructure & support.</p>
                  <Link href="#contact" className="block w-full py-3 rounded-full border border-gray-200 font-medium hover:bg-gray-50 transition-colors">Contact Sales</Link>
               </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="w-full py-32 px-4 bg-gray-50 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-16 text-center">Frequently Asked Questions</h2>
            <FaqAccordion />
          </div>
        </section>

        {/* Value Proposition */}
        <section className="w-full py-32 px-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-8">Scale Your Institution Without Friction</h2>
            <p className="text-xl text-gray-600 mb-12">
              Join leading forward-thinking schools that have simplified their operations, secured their data, and empowered their students with Village AI Nexus.
            </p>
            <Link href="/login" className="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all inline-flex items-center gap-2">
              Start Your Free Trial
            </Link>
          </div>
        </section>
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
