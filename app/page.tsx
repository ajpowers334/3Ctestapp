import { AuthForm } from "@/components/auth-form"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5">
                  <span className="text-sm font-medium text-primary">Empowering Youth, Inspiring Futures</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
                  Carolina Canyon Co.
                </h1>
                <p className="text-lg text-muted-foreground text-pretty leading-relaxed md:text-xl">
                  Providing transformative youth programs, workforce development, and financial literacy initiatives to
                  underserved communities in Washington, D.C. We ignite potential, foster lifelong learning, and build
                  pathways to economic mobility and generational success.
                </p>
                {/* </CHANGE> */}
              </div>

              {/* Features Grid */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <h3 className="font-semibold">Youth Programs</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Transformative initiatives for young minds
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <h3 className="font-semibold">Workforce Development</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Career pathways in high-demand industries
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <h3 className="font-semibold">Financial Literacy</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">Building economic mobility for all</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <h3 className="font-semibold">Community Impact</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">Creating generational success in D.C.</p>
                </div>
              </div>
              {/* </CHANGE> */}
            </div>

            {/* Right Column - Form */}
            <div className="lg:pl-8">
              <AuthForm />
            </div>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      </section>

      {/* STEMpact Academy Section */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4 text-center">
              <div className="inline-block rounded-full bg-accent/10 px-4 py-1.5">
                <span className="text-sm font-medium text-accent">Featured Program</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
                STEMpact Academy
              </h2>
              <p className="text-xl font-semibold text-primary">Launching Futures in Tech</p>
            </div>

            <div className="space-y-6">
              <p className="text-lg text-foreground/90 text-pretty leading-relaxed">
                Envision a future where today's youth become tomorrow's tech leaders, where innovation and creativity
                drive progress. That's the promise of STEMpact Academy, an intensive program that equips young minds
                with the skills and knowledge to thrive in the tech-driven world.
              </p>

              <div className="bg-card rounded-xl p-6 md:p-8 border border-border shadow-sm">
                <p className="text-base text-foreground/90 leading-relaxed">
                  STEMpact Academy is an intensive program designed to prepare youth and young adults for careers in
                  high-demand STEM industries. Through hands-on training, industry certifications, and real-world
                  experience, participants gain the skills and knowledge to succeed in fields such as AI, robotics,
                  gaming, and cybersecurity.
                </p>
              </div>

              {/* STEM Fields Grid */}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-4">
                <div className="bg-card rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary mb-1">AI</div>
                  <p className="text-sm text-muted-foreground">Artificial Intelligence</p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary mb-1">Robotics</div>
                  <p className="text-sm text-muted-foreground">Automation & Design</p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary mb-1">Gaming</div>
                  <p className="text-sm text-muted-foreground">Development & Design</p>
                </div>
                <div className="bg-card rounded-lg p-4 border border-border text-center">
                  <div className="text-2xl font-bold text-primary mb-1">Security</div>
                  <p className="text-sm text-muted-foreground">Cybersecurity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* </CHANGE> */}
    </main>
  )
}
