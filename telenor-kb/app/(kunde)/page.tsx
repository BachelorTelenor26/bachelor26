import SearchBar from "../components/kunde/SearchBar";
import CategoryCard from "../components/kunde/CategoryCard";
import { WifiOff, WifiLow, Router } from "lucide-react";
import ArticleListItem from "../components/kunde/ArticleListItem";
import { articles } from "../lib/mockData";

export default function KundePage() {
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
          popularSearches={['Router lyser rødt', 'Treg wifi', 'Mobil mister dekning', 'Bytte passord']}
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
          {/* Kun for å se design ,dette må refactors til å heller iterere gjennom det vi får fra db  */}
          <CategoryCard
            icon={WifiOff}
            title="Ingen internettforbindelse"
            description="Nettet er helt nede hjemme"
            href="/kategorier/ingen-internett"
          />

          <CategoryCard
            icon={WifiLow}
            title="Tregt eller ustabilt nett"
            description="Nettet som dropper eller er sakte"
            href="/kategorier/ingen-internett"
          />

          <CategoryCard
            icon={Router}
            title="Ruter lyser rødt"
            description="Ruter som lyser rødt"
            href="/kategorier/ingen-internett"
          />

          <CategoryCard
            icon={Router}
            title="Ruter lyser rødt"
            description="Ruter som lyser rødt"
            href="/kategorier/ingen-internett"
          />

          <CategoryCard
            icon={Router}
            title="Ruter lyser rødt"
            description="Ruter som lyser rødt"
            href="/kategorier/ingen-internett"
          />

          <CategoryCard
            icon={Router}
            title="Ruter lyser rødt"
            description="Ruter som lyser rødt"
            href="/kategorier/ingen-internett"
          />
        </div>
      </section>

        {/* Mest leste */}
        <section className="font-bold mt-12">
          <h2 className="font-semibold text-gray-900 mb-4">
            Mest leste akkurat nå
          </h2>
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            {articles.map((article) => (
              <ArticleListItem key={article.slug} article={article} />
            ))}
          </div>
        </section>

    </>
  );
}
