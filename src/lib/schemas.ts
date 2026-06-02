import { z } from "zod";

export const AddressSchema = z.object({
  cep: z.string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 8, {
      message: "O CEP deve conter exatamente 8 dígitos",
    }),
  logradouro: z.string().min(1, "O logradouro é obrigatório"),
  bairro: z.string().min(1, "O bairro é obrigatório"),
  complemento: z.string().optional().nullable(),
  localidade: z.string().min(1, "A cidade é obrigatória"),
  uf: z.string().length(2, "A UF deve conter 2 caracteres"),
  ddd: z.string().optional().nullable(),
  ibge: z.string().optional().nullable(),
  regiao: z.string().optional().nullable(),
});

export type AddressInput = z.infer<typeof AddressSchema>;
