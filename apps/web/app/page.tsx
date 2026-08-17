import Link from "next/link";
import {
  Sparkles,
  Wallet,
  CheckSquare,
  Store,
  MapPin,
  CalendarDays,
  Heart,
} from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Budget clarity",
    description:
      "One number for your total budget, planned per category, with alerts before you overspend.",
  },
  {
    icon: CheckSquare,
    title: "Smart task plan",
    description:
      "A complete planning checklist generated from your wedding date — editable, assignable, and always up to date.",
  },
  {
    icon: Store,
    title: "Vendors in one place",
    description:
      "Every professional with their contact details, price, and status. Call, WhatsApp, or email in one tap.",
  },
  {
    icon: MapPin,
    title: "Locations & venues",
    description:
      "Shortlist venues, compare them side by side, and open any address in Maps.",
  },
  {
    icon: CalendarDays,
    title: "Events & timeline",
    description:
      "Every function scheduled, with your wedding day laid out hour by hour.",
  },
  {
    icon: Heart,
    title: "Plan together",
    description:
      "Invite your partner, planner, or family with the right role — everyone sees one source of truth.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold text-charcoal">
            Wedding Planner
          </span>
        </div>
        <nav className="flex items-center gap-6" aria-label="Primary">
          <Link href="/#features" className="hidden text-sm font-medium text-stone-warm hover:text-charcoal sm:block">
            Features
          </Link>
          <Link href="/login" className="text-sm font-medium text-charcoal hover:text-gold">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-cream hover:bg-charcoal/85"
          >
            Start Planning Free
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center md:pt-24">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gold-soft bg-gold-soft/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
            <Heart className="h-3 w-3 fill-rose text-rose" /> One place for everything
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-charcoal md:text-6xl">
            Plan your wedding.
            <br />
            <span className="text-rose">Without the chaos.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-stone-warm">
            Everything you need to plan your perfect day, in one beautiful place —
            budget, tasks, vendors, locations, events and notes, together.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-gold px-7 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-gold/85"
            >
              Start Planning Free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-sand bg-white px-7 py-3.5 text-base font-medium text-charcoal hover:bg-parchment"
            >
              Sign in
            </Link>
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-sand bg-white p-6 shadow-[0_20px_60px_-20px_rgba(45,42,38,0.2)]">
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <div>
                <p className="text-xs text-stone-warm">Good morning, Sarah ❤️</p>
                <p className="font-display text-lg font-semibold text-charcoal">Sarah & Ahmed</p>
              </div>
              <div className="rounded-xl bg-gold-soft/50 px-4 py-2 text-center">
                <p className="font-display text-2xl font-bold text-charcoal">156</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-warm">
                  days to go
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
              {[
                { label: "Budget", value: "AED 84.5k", sub: "of AED 120k" },
                { label: "Tasks", value: "42 / 68", sub: "completed" },
                { label: "Progress", value: "62%", sub: "planned" },
                { label: "Payments", value: "AED 8.5k", sub: "due in 30 days" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-sand bg-cream p-3 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-warm">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-charcoal tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-stone-warm">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-sand bg-white py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-3xl font-semibold text-charcoal md:text-4xl">
              Everything a couple needs
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-stone-warm">
              Stop juggling spreadsheets and chat threads. Your entire wedding lives here.
            </p>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-sand bg-cream p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft/60 text-gold">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-charcoal">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-warm">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-display text-3xl font-semibold text-charcoal md:text-4xl">
              Your wedding, beautifully organised
            </h2>
            <p className="mt-4 text-stone-warm">
              Know exactly what needs to be done, how much you've spent, and what needs
              attention next — every single day.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-block rounded-xl bg-gold px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-gold/85"
            >
              Start Planning Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-display text-sm font-semibold text-charcoal">Wedding Planner</span>
          </div>
          <p className="text-sm text-stone-warm">
            Plan your wedding. Track every detail. Enjoy the journey.
          </p>
        </div>
      </footer>
    </div>
  );
}
