import SearchPageClient from "../../components/shared/SearchPageClient";

async function search(query: string) {
  const res = await fetch(
    `http://localhost:3000/api/search?type=agent&q=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );

  return res.json();
}

export default async function AgentSokPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() || "";

  const data = query ? await search(query) : null;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Agentsøk
      </h1>

      <SearchPageClient basePath="/agent/sok" />

     
    </div>
  );
}