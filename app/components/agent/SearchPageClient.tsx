"use client";

import { useState } from "react";
import { articles } from "@/lib/mockData";
import SearchBar from "../shared/SearchBar";
import Link from "next/link";

export default function SokClient() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = articles
    .filter(
      (item) =>
        activeCategory === "all" || item.category === activeCategory
    )
    .filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="space-y-6">
      
      {/* Tilbake */}
      <Link
        href="/agent/dashboard"
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Dashbord
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        
        {/* Venstre side */}
        <div className="space-y-4">
          <SearchBar
            value={query}
            autoFocus
            onSearch={(q) => setQuery(q)}
          />

          <p className="text-sm text-gray-600 mb-4">
            {filtered.length} treff for &quot;{query}&quot;
          </p>

          <div className="border rounded-xl overflow-hidden bg-white">
            {filtered.map((item) => (
              <Link
                key={item.slug}
                href={`#`}
                className="flex justify-between border-b p-4 hover:bg-blue-100"
              >
                <div>
                  <div className="text-1xl text-blue-600 mb-1">
                    {item.category}
                  </div>

                  <h3 className="font-semibold">{item.title}</h3>

                  <p className="text-sm text-gray-500">
                    Sist oppdatert: {item.updatedAt}
                  </p>
                </div>

                <span className="text-gray-500 text-3xl">›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Høyre side */}
        <div className="space-y-5 sticky top-5 h-fit">
          <div>
            <h2 className="font-bold mb-2">Tips</h2>
            <p className="bg-blue-600 text-white p-4 rounded-xl text-sm">
              Lim inn en sesjons-ID fra kunden direkte i søkefeltet.
            </p>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <h2 className="font-bold mb-2">Ofte søk</h2>
            <ul className="space-y-2 text-sm text-gray-800">
              <li>router lyser rødt</li>
              <li>fiberboks</li>
              <li>wifi tregt</li>
              <li>APN-innstilling</li>
              <li>bytte SIM</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}