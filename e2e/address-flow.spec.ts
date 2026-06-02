import { test, expect } from "@playwright/test";

test.describe("Address Management Flow", () => {
  test("should allow creating, viewing, editing, and deleting an address", async ({ page }) => {
    // Go to homepage
    await page.goto("/");

    // Click "Novo Endereço" to show the form
    await page.click('text="Novo Endereço"');

    // Fill in CEP and search
    const cepInput = page.locator('input[placeholder="00000-000"]');
    await cepInput.fill("01001-000");
    await page.click('button:has-text("Buscar")');

    // Wait for the geocoding/autofill fields to populate
    const logradouroInput = page.locator('input[name="logradouro"]');
    await expect(logradouroInput).toHaveValue("Praça da Sé");

    const localidadeInput = page.locator('input[name="localidade"]');
    await expect(localidadeInput).toHaveValue("São Paulo");

    // Add complemento and save
    const complementoInput = page.locator('input[name="complemento"]');
    await complementoInput.fill("Lado Ímpar");
    await page.click('button:has-text("Salvar Endereço")');

    // Check if the address is listed
    await expect(page.locator('text="01001-000"')).toBeVisible();

    // Select the address
    await page.click('text="01001-000"');
    await expect(page.locator('text="Lado Ímpar"')).toBeVisible();

    // Click edit
    await page.click('[title="Editar"]');
    await expect(page.locator('text="Editar Endereço"')).toBeVisible();

    // Change complemento and save
    await complementoInput.fill("Novo Complemento");
    await page.click('button:has-text("Salvar Alterações")');

    // Verify change
    await page.click('text="01001-000"');
    await expect(page.locator('text="Novo Complemento"')).toBeVisible();

    // Set dialog handler to accept the delete confirmation
    page.on("dialog", (dialog) => dialog.accept());

    // Delete
    await page.click('[title="Excluir"]');

    // Verify it is removed
    await expect(page.locator('text="01001-000"')).not.toBeVisible();
  });
});
