import { defineConfig, devices } from "@playwright/test";

// Os testes rodam em "modo de teste" (sem Firebase): cada teste começa com o
// navegador limpo, então os dados não passam de um teste para outro.
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:8788",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  webServer: {
    command: "node tests/servidor.mjs",
    url: "http://localhost:8788/index.html",
    reuseExistingServer: true,
  },
});
