import { BuildingList } from "@/components/building-list";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Prospecting Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Commercial &amp; industrial buildings ranked by rainwater reuse
          viability
        </p>
      </div>
      <BuildingList />
    </div>
  );
}
