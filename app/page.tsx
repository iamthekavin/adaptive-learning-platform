import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* 1. Hero Section - Asymmetric Compositions */}
      <section className="mx-auto max-w-7xl px-6 pt-32 pb-48 lg:px-12">
        <div className="asymmetric-layout">
          <div className="reveal">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/[0.04] bg-white/[0.02] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40 border-stone-800">
              <Zap className="h-3 w-3 text-indigo-500" />
              Intelligence in Session
            </div>
            <h1 className="text-balance text-6xl font-black leading-[0.9] sm:text-8xl lg:text-[10rem]">
              LEAD THE<br />
              <span className="text-white/20">FUTURE.</span>
            </h1>
            <p className="mt-12 max-w-md text-lg font-medium leading-relaxed text-white/40 reveal reveal-stagger-1">
              A minimalist adaptive ecosystem bridging the gap between institutional structure 
              and individual potential. Built for precision.
            </p>
            <div className="mt-12 flex items-center gap-8 reveal reveal-stagger-2">
              <Link href="/sign-up" className="btn-premium">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#concepts" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                View Concepts
              </Link>
            </div>
          </div>
          
          {/* Asymmetric geometric element */}
          <div className="hidden lg:block reveal reveal-stagger-3">
            <div className="relative h-[500px] w-full">
              <div className="absolute top-0 right-0 h-full w-4/5 rounded-2xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-3xl" />
              <div className="absolute bottom-12 left-0 h-48 w-48 rounded bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="h-2 w-12 bg-indigo-500 rounded-full" />
                <div className="mt-4 h-2 w-full bg-white/5 rounded-full" />
                <div className="mt-2 h-2 w-2/3 bg-white/5 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Concepts (Features) - Minimal, Ultra-Clean */}
      <section id="concepts" className="border-t border-white/[0.04] py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-24 flex items-end justify-between border-b border-white/[0.04] pb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">Core Architecture</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight uppercase sm:text-6xl text-stone-100">
                The Modules.
              </h2>
            </div>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-white/30 hidden sm:block">
              Every detail is engineered to support the complex hierarchy of modern academia.
            </p>
          </div>

          <div className="grid gap-px bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                title: "Adaptive Engine", 
                desc: "Real-time mastery detection and path adjustments." 
              },
              { 
                title: "Regulation Centric", 
                desc: "Full support for parallel academic frameworks." 
              },
              { 
                title: "Secure Integrity", 
                desc: "AI-assisted proctoring and score verification." 
              },
              { 
                title: "Smart Monitoring", 
                desc: "Institutional dashboards with predictive alerts." 
              },
              { 
                title: "Role Hierarchy", 
                desc: "Granular access for Admins, Teachers, and Students." 
              },
              { 
                title: "Resource Hub", 
                desc: "Centralized content delivery and CO tracking." 
              }
            ].map((feature, i) => (
              <div key={i} className="bg-black p-12 transition-colors hover:bg-white/[0.01] group border border-white/[0.02] hover:border-white/10">
                <span className="text-[10px] font-bold text-white/20">0{i + 1}</span>
                <h3 className="mt-6 text-xl font-bold uppercase tracking-tight">{feature.title}</h3>
                <p className="mt-4 text-sm font-medium text-white/30 leading-relaxed group-hover:text-white/50 transition-colors">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The Roles - Strong Hierarchy */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-20 lg:grid-cols-2 items-center">
            <div className="relative h-[400px] w-full border border-white/[0.04] bg-white/[0.01] overflow-hidden rounded-2xl">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
               <div className="p-12">
                 <div className="h-1 w-20 bg-white/20 mb-8" />
                 <p className="text-4xl font-black text-white leading-none">Institutional<br />Access.</p>
               </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Hierarchy</p>
              <h2 className="mt-6 text-4xl font-black uppercase sm:text-6xl">Defined by Roles.</h2>
              <div className="mt-12 space-y-12">
                {[
                  { role: "Admins", text: "Governance, departments, and institution-wide analytics." },
                  { role: "Teachers", text: "Lesson planning, assessment design, and student tracking." },
                  { role: "Students", text: "Personalized paths, resources, and performance insights." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 group">
                    <span className="text-xs font-bold text-white/20 group-hover:text-indigo-500 transition-colors pt-1">0{i+1}</span>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest">{item.role}</h4>
                      <p className="mt-2 text-sm text-white/40 font-medium leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust Banner */}
      <section className="border-y border-white/[0.04] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold uppercase tracking-[0.3em] text-white/60">
              Built for trust.
            </h2>
            <p className="mt-6 max-w-xl text-lg font-medium text-white/30 leading-relaxed">
              Trusted by second-year IT students and leading academic institutions 
              to redefine the limits of personalized education.
            </p>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-12 opacity-20 filter grayscale contrast-200">
               <div className="h-6 w-24 bg-white/20 rounded-sm" />
               <div className="h-6 w-24 bg-white/20 rounded-sm" />
               <div className="h-6 w-24 bg-white/20 rounded-sm" />
               <div className="h-6 w-24 bg-white/20 rounded-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Perfect Spacing */}
      <footer className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-12 border-b border-white/[0.04] pb-12">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-indigo-500" />
              <span className="text-sm font-bold uppercase tracking-tighter">Adaptive Platform</span>
            </div>
            <div className="flex gap-8">
              {["Terms", "Privacy", "Contact", "Log"].map((item) => (
                <Link key={item} href="#" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <p className="mt-12 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">
            &copy; {new Date().getFullYear()} Precision Academia.
          </p>
        </div>
      </footer>
    </div>
  );
}
