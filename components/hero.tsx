import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  Building2,
  TrendingUp,
  Shield,
  ArrowRight,
} from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero content */}
        <div className="pb-16 pt-20 sm:pb-24 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Droplets className="h-4 w-4" />
              Grundfos HackSMU Challenge
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Possibility in{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Every Drop
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              An automated prospecting engine that identifies commercial and
              industrial buildings with the highest viability for rainwater reuse
              systems. Powered by satellite data, financial analysis, and ESG
              signals.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 text-base">
                  Explore Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: Building2,
                value: "18",
                label: "Buildings Analyzed",
              },
              {
                icon: Droplets,
                value: "42M+",
                label: "Gallons Capturable / yr",
              },
              {
                icon: TrendingUp,
                value: "$380K+",
                label: "Potential Savings / yr",
              },
              {
                icon: Shield,
                value: "9",
                label: "States Covered",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-xl border bg-card p-5 shadow-sm"
              >
                <stat.icon className="mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="mt-1 text-center text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features section */}
        <div className="border-t pb-20 pt-16">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
            How It Works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Physical Detection",
                description:
                  "AI-powered analysis of satellite imagery identifies roof catchment areas >100,000 sq ft and detects cooling towers with confidence scoring.",
              },
              {
                step: "02",
                title: "Financial Cross-Reference",
                description:
                  "Cross-references water utility costs, tax incentives, stormwater fees, and regulatory drivers to quantify business ROI.",
              },
              {
                step: "03",
                title: "Viability Scoring",
                description:
                  "Generates a holistic Viability Score combining physical attributes, financial data, and corporate ESG commitments.",
              },
            ].map((feature) => (
              <div
                key={feature.step}
                className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {feature.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key data sources */}
        <div className="border-t pb-20 pt-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Data Sources
          </h2>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
            {[
              "Google Earth Engine",
              "Sentinel-2 Satellite",
              "US EPA Water Data",
              "SEC EDGAR (ESG)",
              "Municipal Open Data",
              "ARCSA Standards",
              "FEMP Calculator",
              "SBTi Database",
            ].map((source) => (
              <span
                key={source}
                className="rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
