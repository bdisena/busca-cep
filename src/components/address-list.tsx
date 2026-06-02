"use client";

import { Edit, Trash2, MapPin, Search } from "lucide-react";
import { useState } from "react";

export interface Address {
  id: string;
  cep: string;
  logradouro: string;
  bairro: string;
  complemento?: string | null;
  localidade: string;
  uf: string;
  ddd?: string | null;
  ibge?: string | null;
  regiao?: string | null;
}

interface AddressListProps {
  addresses: Address[];
  onSelect: (address: Address) => void;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => Promise<void>;
  selectedId?: string;
}

export default function AddressList({
  addresses,
  onSelect,
  onEdit,
  onDelete,
  selectedId,
}: AddressListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAddresses = addresses.filter((addr) => {
    const term = searchTerm.toLowerCase();
    return (
      addr.cep.includes(term) ||
      addr.logradouro.toLowerCase().includes(term) ||
      addr.localidade.toLowerCase().includes(term) ||
      addr.bairro.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[500px]">
      <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-sm font-semibold text-zinc-900 mb-2">Endereços Salvos</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar nos salvos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C51F33]/50 focus:border-[#C51F33]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
        {filteredAddresses.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            Nenhum endereço encontrado.
          </div>
        ) : (
          filteredAddresses.map((address) => {
            const isSelected = selectedId === address.id;
            return (
              <div
                key={address.id}
                onClick={() => onSelect(address)}
                className={`p-3 flex items-start justify-between gap-3 cursor-pointer transition hover:bg-zinc-50 ${
                  isSelected ? "bg-zinc-50 border-l-2 border-[#C51F33]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-block px-1.5 py-0.5 bg-zinc-100 text-zinc-800 text-[10px] font-semibold rounded uppercase">
                      {address.uf}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900">
                      {address.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 truncate">
                    {address.logradouro}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {address.bairro} · {address.localidade}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelect(address)}
                    className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-950 transition"
                    title="Ver no mapa"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(address)}
                    className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-blue-600 transition"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(address.id)}
                    className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-red-600 transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
