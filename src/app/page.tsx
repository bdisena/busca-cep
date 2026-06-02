"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Plus, RefreshCw, MapPin } from "lucide-react";
import AddressForm from "@/components/address-form";
import AddressList, { Address } from "@/components/address-list";
import { AddressInput } from "@/lib/schemas";

// Dynamically import Leaflet Map component (SSR safe)
const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-zinc-100 rounded-2xl flex items-center justify-center border border-zinc-200">
      <Loader2 className="w-8 h-8 text-[#C51F33] animate-spin" />
    </div>
  ),
});

export default function Home() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Default to Brasilia
  const defaultCoords = { lat: -15.7801, lon: -47.9292 };

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/addresses");
      if (!res.ok) throw new Error("Erro ao buscar endereços");
      const data = await res.json();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || "Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Geocode address using Nominatim
  const geocode = async (addr: Address) => {
    try {
      const { logradouro, bairro, localidade, uf } = addr;
      const query = `${logradouro}, ${bairro ? bairro + ", " : ""}${localidade}, ${uf}, Brasil`;
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: "1",
        countrycodes: "br",
      });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "User-Agent": "BuscaCEP-Next/1.0" },
      });
      const results = await res.json();

      if (results && results.length > 0) {
        setMapCoords({
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon),
        });
      } else {
        // Fallback to city/state
        const cityQuery = `${localidade}, ${uf}, Brasil`;
        const resCity = await fetch(
          `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
            q: cityQuery,
            format: "json",
            limit: "1",
            countrycodes: "br",
          })}`,
          { headers: { "User-Agent": "BuscaCEP-Next/1.0" } }
        );
        const resultsCity = await resCity.json();

        if (resultsCity && resultsCity.length > 0) {
          setMapCoords({
            lat: parseFloat(resultsCity[0].lat),
            lon: parseFloat(resultsCity[0].lon),
          });
        }
      }
    } catch (err) {
      console.warn("Geocodificação falhou", err);
    }
  };

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddress(addr);
    geocode(addr);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir endereço");
      if (selectedAddress?.id === id) {
        setSelectedAddress(null);
        setMapCoords(null);
      }
      fetchAddresses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (data: AddressInput) => {
    try {
      if (editingAddress) {
        // Update
        const res = await fetch(`/api/addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao atualizar");
        }
        setIsEditing(false);
        setEditingAddress(null);
      } else {
        // Create
        const res = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao criar");
        }
        setIsAdding(false);
      }
      fetchAddresses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Elemento Gráfico Acelera */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[120px] border-t-[#C51F33] border-l-[120px] border-l-transparent z-0" aria-hidden="true" />

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 py-4 px-6 relative z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 flex items-center gap-1">
              acelera<span className="text-[#C51F33]">cep</span>
            </h1>
            <span className="h-5 w-px bg-zinc-200" />
            <p className="text-xs text-zinc-500 font-medium">Painel de Endereços</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAdding(true);
                setIsEditing(false);
                setEditingAddress(null);
              }}
              className="px-3.5 py-1.5 bg-[#C51F33] hover:bg-[#a61727] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Endereço
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left column - list & actions */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {isAdding || isEditing ? (
            <AddressForm
              initialValues={editingAddress || undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsAdding(false);
                setIsEditing(false);
                setEditingAddress(null);
              }}
            />
          ) : (
            <AddressList
              addresses={addresses}
              onSelect={handleSelectAddress}
              onEdit={(addr) => {
                setEditingAddress(addr);
                setIsEditing(true);
                setIsAdding(false);
              }}
              onDelete={handleDeleteAddress}
              selectedId={selectedAddress?.id}
            />
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span className="font-semibold">Erro:</span> {error}
              <button onClick={fetchAddresses} className="ml-auto p-1 hover:bg-red-100 rounded">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right column - details & map */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {selectedAddress ? (
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-red-50 text-[#C51F33] text-xs font-bold rounded">
                      {selectedAddress.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500 font-medium">
                      {selectedAddress.localidade} - {selectedAddress.uf}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-950">
                    {selectedAddress.logradouro}
                  </h2>
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600">
                  <MapPin className="w-3.5 h-3.5 text-[#C51F33]" />
                  {mapCoords ? `${mapCoords.lat.toFixed(4)}, ${mapCoords.lon.toFixed(4)}` : "Carregando..."}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-zinc-400 font-medium mb-0.5">Bairro</span>
                  <span className="text-zinc-800 font-semibold">{selectedAddress.bairro}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 font-medium mb-0.5">Complemento</span>
                  <span className="text-zinc-800 font-semibold">{selectedAddress.complemento || "—"}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 font-medium mb-0.5">DDD</span>
                  <span className="text-zinc-800 font-semibold">{selectedAddress.ddd || "—"}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 font-medium mb-0.5">Região</span>
                  <span className="text-zinc-800 font-semibold uppercase">{selectedAddress.regiao || "—"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center py-12">
              <MapPin className="w-8 h-8 text-zinc-300 mb-2" />
              <h3 className="text-sm font-semibold text-zinc-800">Nenhum Endereço Selecionado</h3>
              <p className="text-xs text-zinc-400 max-w-xs mt-1">
                Selecione um endereço na lista ao lado ou crie um novo para visualizar suas coordenadas e mapa.
              </p>
            </div>
          )}

          <div className="flex-1 min-h-[350px] relative">
            <Map
              lat={mapCoords?.lat ?? defaultCoords.lat}
              lon={mapCoords?.lon ?? defaultCoords.lon}
              popupTitle={selectedAddress?.cep}
              popupAddress={selectedAddress ? `${selectedAddress.logradouro}, ${selectedAddress.bairro}` : undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
