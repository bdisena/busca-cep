"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddressSchema, AddressInput } from "@/lib/schemas";
import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

interface AddressFormProps {
  initialValues?: AddressInput & { id?: string };
  onSubmit: (data: AddressInput) => Promise<void>;
  onCancel?: () => void;
}

export default function AddressForm({ initialValues, onSubmit, onCancel }: AddressFormProps) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddressInput>({
    resolver: zodResolver(AddressSchema),
    defaultValues: initialValues || {
      cep: "",
      logradouro: "",
      bairro: "",
      complemento: "",
      localidade: "",
      uf: "",
      ddd: "",
      ibge: "",
      regiao: "",
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  const cepValue = watch("cep");

  const handleCepSearch = async () => {
    const cleanCep = cepValue?.replace(/\D/g, "");
    if (!cleanCep || cleanCep.length !== 8) {
      setCepError("CEP inválido. Digite 8 números.");
      return;
    }

    setLoadingCep(true);
    setCepError(null);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepError("CEP não encontrado.");
        return;
      }

      setValue("logradouro", data.logradouro || "");
      setValue("bairro", data.bairro || "");
      setValue("complemento", data.complemento || "");
      setValue("localidade", data.localidade || "");
      setValue("uf", data.uf || "");
      setValue("ddd", data.ddd || "");
      setValue("ibge", data.ibge || "");
      setValue("regiao", data.regiao || "");
    } catch (err) {
      setCepError("Erro ao buscar o CEP. Tente preencher manualmente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);
    if (val.length > 5) {
      val = `${val.slice(0, 5)}-${val.slice(5)}`;
    }
    setValue("cep", val);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-950">
        {initialValues?.id ? "Editar Endereço" : "Adicionar Novo Endereço"}
      </h3>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">CEP</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="00000-000"
            onChange={handleCepChange}
            value={cepValue || ""}
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C51F33]/50 focus:border-[#C51F33] text-sm"
          />
          <button
            type="button"
            onClick={handleCepSearch}
            disabled={loadingCep}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition"
          >
            {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>
        {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
        {errors.cep && <p className="text-xs text-red-500 mt-1">{errors.cep.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Logradouro</label>
          <input
            type="text"
            {...register("logradouro")}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C51F33]/50 focus:border-[#C51F33] text-sm"
          />
          {errors.logradouro && <p className="text-xs text-red-500 mt-1">{errors.logradouro.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Bairro</label>
          <input
            type="text"
            {...register("bairro")}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C51F33]/50 focus:border-[#C51F33] text-sm"
          />
          {errors.bairro && <p className="text-xs text-red-500 mt-1">{errors.bairro.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Complemento</label>
          <input
            type="text"
            {...register("complemento")}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C51F33]/50 focus:border-[#C51F33] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Cidade</label>
          <input
            type="text"
            {...register("localidade")}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C51F33]/50 focus:border-[#C51F33] text-sm"
          />
          {errors.localidade && <p className="text-xs text-red-500 mt-1">{errors.localidade.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">UF (Estado)</label>
          <input
            type="text"
            maxLength={2}
            {...register("uf")}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C51F33]/50 focus:border-[#C51F33] text-sm uppercase"
          />
          {errors.uf && <p className="text-xs text-red-500 mt-1">{errors.uf.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-medium transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#C51F33] hover:bg-[#a61727] disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialValues?.id ? "Salvar Alterações" : "Salvar Endereço"}
        </button>
      </div>
    </form>
  );
}
