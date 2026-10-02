import { ExchangeRateWidget } from "@/components/dashboard/ExchangeRateWidget";
import { Greeting } from "@/components/dashboard/Greeting";
import bagWatermark from "@/assets/branding/miharina-bag-watermark.png";

interface DashboardHeroProps {
  name?: string | null;
  favoriteBanks: string[];
}

export function DashboardHero({ name, favoriteBanks }: DashboardHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-panel bg-brand-hero text-brand-hero-foreground shadow-sm">
      <img
        src={bagWatermark}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute -right-14 -top-5 -z-10 h-64 w-64 object-contain opacity-[0.45] sm:-right-6 sm:-top-7 sm:h-80 sm:w-80"
      />
      <div className="px-5 py-6 pr-20 sm:px-7 sm:py-7 sm:pr-72">
        <Greeting name={name} />
      </div>
      <ExchangeRateWidget favoriteBanks={favoriteBanks} />
    </section>
  );
}
