import { describe, it, expect } from "vitest";
import { AddressSchema } from "@/lib/schemas";

describe("AddressSchema Validation", () => {
  it("should validate a valid address input", () => {
    const validData = {
      cep: "01001-000",
      logradouro: "Praça da Sé",
      bairro: "Sé",
      localidade: "São Paulo",
      uf: "SP",
    };

    const parsed = AddressSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cep).toBe("01001000"); // should strip non-digits
    }
  });

  it("should reject an invalid CEP", () => {
    const invalidData = {
      cep: "123",
      logradouro: "Praça da Sé",
      bairro: "Sé",
      localidade: "São Paulo",
      uf: "SP",
    };

    const parsed = AddressSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("should reject missing mandatory fields", () => {
    const invalidData = {
      cep: "01001-000",
      bairro: "Sé",
      localidade: "São Paulo",
      uf: "SP",
    };

    const parsed = AddressSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });
});
