import { test, expect } from "@playwright/test";

// Cria registros direto pela camada de dados (mais rápido que pela tela).
async function criar(page, codigo) {
  await page.goto("/index.html");
  return page.evaluate(codigo);
}

test.describe("Início e catálogo", () => {
  test("mostra o aviso de modo de teste e a Linha Office já cadastrada, sob orçamento", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.locator(".modo-teste")).toContainText("Modo de teste");
    await expect(page.locator("#total-clientes")).toHaveText("0");

    await page.getByRole("link", { name: "Produtos", exact: true }).click();
    const linhas = page.locator("#lista tbody tr");
    await expect(linhas).toHaveCount(4);
    for (const nome of ["Agenda 2027", "Kit de acessórios para escritório", "Caderno com capa personalizada", "Caderno pautado personalizado"]) {
      await expect(page.locator("#lista")).toContainText(nome);
    }
    await expect(page.locator("#lista").getByText("Sob orçamento")).toHaveCount(4);

    await page.getByRole("button", { name: "Acessórios para escritório", exact: true }).click();
    await expect(linhas).toHaveCount(1);
    await expect(linhas.first()).toContainText("Kit de acessórios para escritório");
  });
});

test.describe("Clientes", () => {
  test("cadastra com CPF e WhatsApp com máscara, recusa CPF inválido e repetido", async ({ page }) => {
    await page.goto("/cliente-form.html");
    await page.getByLabel("Nome").fill("Mariana Albuquerque");
    await page.getByLabel("Empresa").fill("Studio Albuquerque");
    await page.getByLabel("CPF").pressSequentially("52998224724");
    await expect(page.getByLabel("CPF")).toHaveValue("529.982.247-24");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("CPF inválido.")).toBeVisible();

    await page.getByLabel("CPF").fill("529.982.247-25");
    await page.getByLabel("WhatsApp").pressSequentially("81988887777");
    await expect(page.getByLabel("WhatsApp")).toHaveValue("(81) 98888-7777");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page).toHaveURL(/cliente\.html\?id=/);
    await expect(page.getByText("Cliente Mariana Albuquerque cadastrado.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Abrir conversa/ })).toHaveAttribute("href", "https://wa.me/5581988887777");

    await page.goto("/cliente-form.html");
    await page.getByLabel("Nome").fill("Outra pessoa");
    await page.getByLabel("CPF").fill("52998224725");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Já existe um cliente com este CPF.")).toBeVisible();
  });

  test("busca por nome sem acento, empresa e CPF", async ({ page }) => {
    await criar(page, async () => {
      await salvarCliente({ nome: "João Mendes", empresa: "Mendes Eventos", cpf: "11144477735" });
      await salvarCliente({ nome: "Ana Lima", cidade: "Recife", estado: "PE" });
    });
    await page.goto("/clientes.html");
    const busca = page.getByRole("searchbox");
    const linhas = page.locator("#lista tbody tr");
    await expect(linhas).toHaveCount(2);
    await busca.fill("joao");
    await expect(linhas).toHaveCount(1);
    await busca.fill("eventos");
    await expect(linhas).toHaveText(/João Mendes/);
    await busca.fill("111.444");
    await expect(linhas).toHaveText(/João Mendes/);
    await busca.fill("recife");
    await expect(linhas).toHaveText(/Ana Lima/);
  });

  test("mostra texto digitado como texto (sem executar HTML)", async ({ page }) => {
    await criar(page, () => salvarCliente({ nome: '<img src=x onerror="window.invadido=1">' }));
    await page.goto("/clientes.html");
    await expect(page.locator("#lista")).toContainText('<img src=x onerror="window.invadido=1">');
    expect(await page.evaluate(() => window.invadido)).toBeUndefined();
  });
});

test.describe("Vendas", () => {
  test("registra venda com cadastro rápido de cliente e produto, sem sair da tela", async ({ page }) => {
    await page.goto("/venda-form.html");

    // Cliente novo pela janela de cadastro rápido
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    const janelaCliente = page.locator("#modal-novo-cliente");
    await expect(janelaCliente).toBeVisible();
    await janelaCliente.getByLabel("Nome").fill("Paula Ramos");
    await janelaCliente.getByLabel("Empresa").fill("Ramos Eventos");
    await janelaCliente.getByRole("button", { name: "Cadastrar" }).click();
    await expect(janelaCliente).toBeHidden();
    await expect(page.locator("#venda-cliente option:checked")).toHaveText("Paula Ramos — Ramos Eventos");

    // Produto sob orçamento: o valor precisa ser informado
    const primeira = page.locator("[data-item]").first();
    await primeira.locator('[name="produtoId"]').selectOption({ label: "Agenda 2027 (sob orçamento)" });
    await expect(primeira.locator('[name="valorUnitario"]')).toHaveValue("");
    await primeira.locator('[name="quantidade"]').fill("40");
    await page.getByRole("button", { name: "Salvar venda" }).click();
    await expect(page.getByText("Informe o valor: este produto é sob orçamento.")).toBeVisible();
    await primeira.locator('[name="valorUnitario"]').fill("47,50");

    // Produto novo, com preço, pela janela de cadastro rápido
    await page.getByRole("button", { name: "Cadastrar produto" }).click();
    const janelaProduto = page.locator("#modal-novo-produto");
    await janelaProduto.getByLabel("Nome").fill("Bloco de mesa");
    await janelaProduto.getByLabel("Preço (R$)").fill("25,00");
    await janelaProduto.getByRole("button", { name: "Cadastrar" }).click();
    await expect(janelaProduto).toBeHidden();
    const segunda = page.locator("[data-item]").nth(1);
    await expect(segunda.locator('[name="produtoId"] option:checked')).toHaveText("Bloco de mesa");
    await expect(segunda.locator('[name="valorUnitario"]')).toHaveValue("25,00");
    await segunda.locator('[name="quantidade"]').fill("2");

    await expect(page.locator("#total")).toHaveText(/R\$\s1\.950,00/);
    await page.getByLabel("Ocasião").selectOption({ label: "Eventos e feiras" });
    await page.getByLabel("Forma de pagamento").selectOption({ label: "Pix" });
    await page.getByLabel("Observações do atendimento").fill("Logo da Ramos na capa.\nEntrega na feira.");
    await page.getByRole("button", { name: "Salvar venda" }).click();

    await expect(page).toHaveURL(/venda\.html\?id=/);
    await expect(page.getByText("Venda registrada.")).toBeVisible();
    await expect(page.locator("tfoot")).toContainText(/R\$\s1\.950,00/);
    await expect(page.locator(".dados")).toContainText("Eventos e feiras");
    await expect(page.locator(".dados")).toContainText("Pix");

    await page.goto("/index.html");
    await expect(page.locator("#vendas-do-mes")).toHaveText("1");
    await expect(page.locator("#faturamento-do-mes")).toHaveText(/R\$\s1\.950,00/);
    await expect(page.locator("#ultimas-vendas")).toContainText("40× Agenda 2027, 2× Bloco de mesa");
  });

  test("recusa venda sem cliente e sem produto", async ({ page }) => {
    await page.goto("/venda-form.html");
    await page.getByRole("button", { name: "Salvar venda" }).click();
    await expect(page.getByText("Escolha o cliente.")).toBeVisible();
    await expect(page.locator("#erro-itens")).toHaveText("Informe pelo menos um produto vendido.");
    await expect(page).toHaveURL(/venda-form\.html/);
  });

  test("abre a nova venda já com o cliente da ficha e permite editar e excluir", async ({ page }) => {
    const idCliente = await criar(page, async () => (await salvarCliente({ nome: "Carlos Dias" })).id);
    await page.goto(`/cliente.html?id=${idCliente}`);
    await page.getByRole("link", { name: "Nova venda" }).click();
    await expect(page.locator("#venda-cliente option:checked")).toHaveText("Carlos Dias");

    const linha = page.locator("[data-item]").first();
    await linha.locator('[name="produtoId"]').selectOption({ label: "Caderno pautado personalizado (sob orçamento)" });
    await linha.locator('[name="valorUnitario"]').fill("30");
    await page.getByRole("button", { name: "Adicionar produto" }).click();
    const outra = page.locator("[data-item]").nth(1);
    await outra.locator('[name="produtoId"]').selectOption({ label: "Agenda 2027 (sob orçamento)" });
    await outra.locator('[name="valorUnitario"]').fill("50");
    await page.getByRole("button", { name: "Salvar venda" }).click();
    await expect(page.locator("tfoot")).toContainText(/R\$\s80,00/);

    await page.getByRole("link", { name: "Editar" }).click();
    await expect(page.locator("[data-item]")).toHaveCount(2);
    await page.locator("[data-item]").nth(1).getByRole("button", { name: "Remover produto" }).click();
    await page.locator("[data-item]").first().locator('[name="quantidade"]').fill("3");
    await expect(page.locator("#total")).toHaveText(/R\$\s90,00/);
    await page.getByRole("button", { name: "Salvar venda" }).click();
    await expect(page.getByText("Venda atualizada.")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(1);

    // Cliente com venda não pode ser excluído
    await page.goto(`/cliente.html?id=${idCliente}`);
    await page.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("tem vendas registradas e não pode ser excluído")).toBeVisible();

    // Produto vendido também não; produto sem venda sim
    await page.goto("/produtos.html");
    page.on("dialog", (dialogo) => dialogo.accept());
    await page.getByRole("button", { name: "Excluir Caderno pautado personalizado" }).click();
    await expect(page.getByText("já aparece em vendas")).toBeVisible();
    await page.getByRole("button", { name: "Excluir Caderno com capa personalizada" }).click();
    await expect(page.getByText("Produto Caderno com capa personalizada excluído.")).toBeVisible();
    await expect(page.locator("#lista tbody tr")).toHaveCount(3);

    // Excluir a venda libera a exclusão do cliente
    await page.goto(`/cliente.html?id=${idCliente}`);
    await page.locator("tbody a").first().click();
    await page.getByRole("button", { name: "Excluir" }).click();
    await expect(page).toHaveURL(/vendas\.html/);
    await expect(page.getByText("Venda excluída.")).toBeVisible();
    await page.goto(`/cliente.html?id=${idCliente}`);
    await page.getByRole("button", { name: "Excluir" }).click();
    await expect(page).toHaveURL(/clientes\.html/);
    await expect(page.getByText("Cliente Carlos Dias excluído.")).toBeVisible();
  });
});

test("cabe na tela do celular sem rolagem para os lados", async ({ browser }) => {
  const contexto = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  const page = await contexto.newPage();
  for (const pagina of ["/index.html", "/vendas.html", "/venda-form.html", "/clientes.html", "/cliente-form.html", "/produtos.html"]) {
    await page.goto(pagina);
    await page.waitForLoadState("networkidle");
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largura, pagina).toBeLessThanOrEqual(360);
  }
  await contexto.close();
});

test("endereço inexistente mostra a página 404", async ({ page }) => {
  const resposta = await page.goto("/nao-existe.html");
  expect(resposta.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

// Simula o SDK do Firebase (mesma interface "compat" que o assessor usa) para
// conferir o caminho do Firestore sem precisar de um projeto de verdade.
const FIRESTORE_FALSO = `
window.firebase = {
  apps: [],
  initializeApp(config) { this.apps.push(config); },
  firestore() {
    const dados = JSON.parse(localStorage.getItem("firestore-falso") || "{}");
    const gravar = () => localStorage.setItem("firestore-falso", JSON.stringify(dados));
    const copia = (v) => JSON.parse(JSON.stringify(v));
    let sequencia = 0;
    const referencia = (colecao, id) => ({
      id,
      async get() {
        const doc = (dados[colecao] || {})[id];
        return { id, exists: doc !== undefined, data: () => copia(doc) };
      },
      async set(registro) {
        if (Object.values(registro).some((v) => v === undefined)) throw new Error("campo undefined");
        (dados[colecao] = dados[colecao] || {})[id] = copia(registro);
        gravar();
      },
      async delete() { delete (dados[colecao] || {})[id]; gravar(); },
    });
    return {
      collection(colecao) {
        return {
          doc(id) { return referencia(colecao, id || "auto" + Date.now().toString(36) + sequencia++); },
          async get() {
            return { docs: Object.entries(dados[colecao] || {}).map(([id, doc]) => ({ id, data: () => copia(doc) })) };
          },
        };
      },
    };
  },
};`;

test("com o Firebase configurado, grava no Firestore e some o aviso de modo de teste", async ({ page }) => {
  await page.route("**/js/firebase-config.js", (rota) => rota.fulfill({
    contentType: "text/javascript",
    body: 'const firebaseConfig = { apiKey: "chave", projectId: "coloridamente-teste", appId: "app" };',
  }));
  await page.route("https://www.gstatic.com/firebasejs/**", (rota) => rota.fulfill({
    contentType: "text/javascript",
    body: rota.request().url().endsWith("firebase-app-compat.js") ? FIRESTORE_FALSO : "",
  }));

  await page.goto("/cliente-form.html");
  await expect(page.locator(".modo-teste")).toHaveCount(0);
  await page.getByLabel("Nome").fill("Cliente na nuvem");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Cliente Cliente na nuvem cadastrado.")).toBeVisible();

  await page.goto("/produtos.html");
  await expect(page.locator("#lista tbody tr")).toHaveCount(4);

  const gravado = await page.evaluate(() => JSON.parse(localStorage.getItem("firestore-falso")));
  expect(Object.values(gravado.clientes).map((c) => c.nome)).toEqual(["Cliente na nuvem"]);
  expect(Object.keys(gravado.produtos)).toHaveLength(4);
  expect(gravado.configuracoes.catalogo.linhaOfficeCadastrada).toBe(true);
  // Nada foi para o armazenamento do modo de teste.
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("assessor-coloridamente:")))).toEqual([]);
});
