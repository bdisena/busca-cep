"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Loader2, MapPin, X, AlertCircle } from "lucide-react";

// Dynamically import Leaflet Map component (SSR safe)
const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-zinc-100 rounded-2xl flex items-center justify-center border border-zinc-200">
      <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
    </div>
  ),
});

interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  ddd?: string;
  ibge?: string;
  regiao?: string;
}

export default function Home() {
  const [cepInput, setCepInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Default to Brasilia
  const defaultCoords = { lat: -15.7801, lon: -47.9292 };

  // Apply mask: 00000-000
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCepInput(value);
    setError(null);
  };

  const handleClear = () => {
    setCepInput("");
    setAddress(null);
    setMapCoords(null);
    setError(null);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanCep = cepInput.replace(/\D/g, "");

    // 1. Validar campo vazio
    if (!cleanCep) {
      setError("Por favor, informe o CEP.");
      return;
    }

    // 2. Validar se possui exatamente 8 dígitos
    if (cleanCep.length !== 8) {
      setError("O CEP deve possuir exatamente 8 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);
    setAddress(null);
    setMapCoords(null);

    try {
      // 3. Consumir API pública de CEP
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!res.ok) {
        throw new Error("API_UNAVAILABLE");
      }
      
      const data = await res.json();

      // 4. Tratar CEP inexistente
      if (data.erro) {
        setError("O CEP informado não foi encontrado.");
        setLoading(false);
        return;
      }

      // Popular dados do endereço
      const addrData: AddressData = {
        cep: data.cep,
        logradouro: data.logradouro || "Não informado",
        bairro: data.bairro || "Não informado",
        localidade: data.localidade,
        uf: data.uf,
        ddd: data.ddd,
        ibge: data.ibge,
        regiao: data.regiao || "Sudeste", // Fallback para exibição
      };

      setAddress(addrData);

      // 5. Converter endereço em coordenadas usando o OpenStreetMap Nominatim API (Geocoding)
      await geocodeAddress(addrData);

    } catch (err: any) {
      if (err.message === "API_UNAVAILABLE") {
        setError("A API de CEP está indisponível no momento. Tente novamente mais tarde.");
      } else {
        setError("Erro ao conectar com a API. Verifique sua conexão com a internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (addr: AddressData) => {
    try {
      const query = `${addr.logradouro}, ${addr.bairro}, ${addr.localidade}, ${addr.uf}, Brasil`;
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: "1",
        countrycodes: "br",
      });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "User-Agent": "AceleraCEP-App/1.0" },
      });
      
      if (!res.ok) throw new Error();
      
      const results = await res.json();

      if (results && results.length > 0) {
        setMapCoords({
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon),
        });
      } else {
        // Se falhar no logradouro completo, busca apenas por Cidade e Estado
        const fallbackQuery = `${addr.localidade}, ${addr.uf}, Brasil`;
        const fbRes = await fetch(
          `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
            q: fallbackQuery,
            format: "json",
            limit: "1",
            countrycodes: "br",
          })}`,
          { headers: { "User-Agent": "AceleraCEP-App/1.0" } }
        );
        const fbResults = await fbRes.json();
        
        if (fbResults && fbResults.length > 0) {
          setMapCoords({
            lat: parseFloat(fbResults[0].lat),
            lon: parseFloat(fbResults[0].lon),
          });
        } else {
          // Fallback final para coordenadas padrão (Brasília)
          setMapCoords(defaultCoords);
        }
      }
    } catch (err) {
      // Em caso de erro de rede ou geolocalização falhar
      setMapCoords(defaultCoords);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#f8fafc]">
      {/* Triângulo vermelho no canto superior direito - Exigência do Manual Acelera */}
      <div 
        className="absolute top-0 right-0 w-0 h-0 border-t-[140px] border-t-brand-red border-l-[140px] border-l-transparent z-50 pointer-events-none md:border-t-[180px] md:border-l-[180px]" 
        aria-hidden="true" 
      />

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 py-5 px-6 relative z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline font-display text-2xl font-bold tracking-tight">
              <span className="text-brand-grey">acelera</span>
              <span className="text-brand-red">cep</span>
            </div>
            <span className="h-6 w-px bg-zinc-200 hidden sm:inline" />
            <p className="text-xs text-brand-grey font-medium tracking-wide uppercase hidden sm:inline">
              Consulta de Endereços
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Coluna Esquerda: Busca e Dados do Endereço (5 colunas) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
          
          {/* Card de Busca de CEP */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md relative overflow-hidden">
            {/* Faixa decorativa no topo do card usando estampa geométrica azul do manual */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-blue-grey" />
            
            <h2 className="font-display text-xl font-bold text-brand-navy mb-2 mt-2 text-left">
              Buscar CEP
            </h2>
            <p className="text-xs text-brand-grey leading-relaxed text-left mb-6">
              Digite o número do CEP para preencher automaticamente as informações e visualizar a localização no mapa.
            </p>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="cep-input" className="block text-xs font-semibold text-brand-navy mb-1.5 uppercase tracking-wider text-left">
                  Código Postal (CEP)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="cep-input"
                    type="text"
                    placeholder="00000-000"
                    value={cepInput}
                    onChange={handleCepChange}
                    className="w-full pl-4 pr-12 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-sm font-medium tracking-wide transition placeholder-zinc-400 text-brand-navy"
                  />
                  {cepInput && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-3 p-1 text-zinc-400 hover:text-brand-navy rounded-full hover:bg-zinc-100 transition"
                      title="Limpar campo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-red hover:bg-[#a30b27] disabled:bg-brand-red/50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-brand-red/10 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando CEP...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Buscar CEP
                  </>
                )}
              </button>
            </form>

            {/* Mensagem de Erro */}
            {error && (
              <div className="mt-4 p-3.5 bg-red-50/80 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}
          </div>

          {/* Card de Dados do Endereço */}
          {address && (
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
              <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-brand-navy">
                  Endereço Encontrado
                </h3>
                <span className="px-2.5 py-1 bg-red-50 text-brand-red text-xs font-bold rounded-lg border border-red-100">
                  {address.cep}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="col-span-2">
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Logradouro</span>
                  <span className="text-sm font-bold text-brand-navy block leading-tight">{address.logradouro}</span>
                </div>
                
                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Bairro</span>
                  <span className="text-sm font-bold text-brand-navy block">{address.bairro}</span>
                </div>

                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Cidade / UF</span>
                  <span className="text-sm font-bold text-brand-navy block">{address.localidade} - {address.uf}</span>
                </div>

                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">DDD</span>
                  <span className="text-sm font-bold text-brand-navy block">{address.ddd || "Não informado"}</span>
                </div>

                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Código IBGE</span>
                  <span className="text-sm font-bold text-brand-navy block">{address.ibge || "Não informado"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Mapa e Marca (7 colunas) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Card do Mapa */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-md flex-1 min-h-[380px] flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3.5 pl-1">
              <MapPin className="w-4 h-4 text-brand-red" />
              <h3 className="font-display text-sm font-bold text-brand-navy">
                Visualização de Localização
              </h3>
            </div>
            
            <div className="flex-1 w-full relative rounded-xl overflow-hidden border border-zinc-100 min-h-[320px]">
              <Map
                lat={mapCoords?.lat ?? defaultCoords.lat}
                lon={mapCoords?.lon ?? defaultCoords.lon}
                popupTitle={address ? address.cep : "Localização de Referência"}
                popupAddress={address ? `${address.logradouro}, ${address.localidade}` : "Brasília, DF"}
              />
            </div>
          </div>

          {/* Banner Institucional Acelera - Usando a identidade e cores corporativas */}
          <div className="bg-brand-navy text-white p-5 rounded-2xl border border-brand-navy shadow-md relative overflow-hidden">
            <div className="brand-pattern absolute inset-0 z-0" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-left">
              <div className="shrink-0 p-3 bg-white/10 rounded-xl">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10V3L4 14H11V21L20 10H13Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-white mb-1">
                  Identidade Visual Acelera
                </h4>
                <p className="text-xs text-brand-light font-sans leading-relaxed">
                  Aplicação customizada utilizando a paleta de cores corporativa PMS 533 (Azul Escuro), PMS 200 (Vermelho) e PMS 431 (Cinza de suporte), além do tradicional triângulo indicador de topo e fontes recomendadas pelo manual de marca.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-4 px-6 relative z-10 text-center">
        <p className="text-[11px] text-brand-grey font-medium font-sans">
          &copy; {new Date().getFullYear()} Acelera. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
