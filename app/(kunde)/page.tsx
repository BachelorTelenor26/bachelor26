import SearchBar from "../components/kunde/SearchBar";
import CategoryCard from "../components/kunde/CategoryCard";
import { WifiOff, WifiLow, WifiSync, Router } from "lucide-react";
import ArticleListItem from "../components/kunde/ArticleListItem";
import { formatCategoryName } from '../lib/utils'


// Midlertidig ikon-mapping til vi har ikoner i databasen og også beskrivelse
const categoryMap: Record<
  string,
  {
    icon: React.FC<{ className?: string }>;
    description: string;
  }
> = {
  "ikke-pa-nett": { icon: WifiOff, description: "Nettet er helt nede hjemme" },
  "tregt-nett": {
    icon: WifiLow,
    description: "Nett som dropper eller er sakte",
  },
  "ustabilt-nett": {
    icon: WifiSync,
    description: "Ustabilt eller varierende nett",
  },
};

async function getCategories() {
  const res = await fetch("http://localhost:3000/api/categories", {
    cache: "no-store",
  });
  return res.json();
}

async function getArticles() {
  const res = await fetch("http://localhost:3000/api/articles", {
    cache: "no-store",
  });
  return res.json();
}

export default async function KundePage() {
  const categories = await getCategories();
  const articles = await getArticles();

  return (
    <>
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hva trenger du hjelp med?
        </h1>
        <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
          Løs bredbåndsproblemer selv.. Her finner du enkle guider for alt fra
          treg Wi-Fi til nett som ikke fungerer. Selvbetjening som gir deg
          kontroll.
        </p>
        <SearchBar
          popularSearches={[
            "Router lyser rødt",
            "Treg wifi",
            "Mobil mister dekning",
            "Bytte passord",
          ]}
        />
      </section>

      {/* Kategoriseksjon */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Bla etter kategori</h2>
          <span className="text-sm text-gray-400">
            Velg hva problemet gjelder
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {categories.map(
            (category: { id: string; name: string; slug: string }) => {
              const entry = categoryMap[category.slug];
              const Icon = entry?.icon ?? Router;
              return (
                <CategoryCard
                  key={category.id}
                  icon={Icon}
                  title={formatCategoryName(category.slug)}
                  description={entry?.description ?? ""}
                  href={`/feilsoking/${category.slug}`}
                />
              );
            },
          )}
        </div>
      </section>

      {/* Mest leste */}
      <section className="font-bold mt-12">
        <h2 className="font-semibold text-gray-900 mb-4">
          Mest leste akkurat nå
        </h2>
        <div className="border border-gray-300 rounded-xl overflow-hidden">
          {articles
            .slice(0, 6)
            .map(
              (article: {
                slug: string;
                title: string;
                category: { name: string };
                deviceType: { name: string };
              }) => (
                <ArticleListItem key={article.slug} article={article} />
              ),
            )}
        </div>
      </section>
    </>
  );
}
