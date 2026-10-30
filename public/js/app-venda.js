// Detalhe da venda: produtos vendidos, total e dados do atendimento.

(async function () {
  const area = document.getElementById("venda");
  const id = parametro("id");
  let venda;
  try {
    venda = await obterVenda(id);
  } catch (erro) {
    area.innerHTML = "";
    mostrarErroDeCarregamento(erro);
    return;
  }
  if (!venda) {
    area.innerHTML = `<div class="vazio"><i class="bi bi-bag-x" aria-hidden="true"></i><p>Venda não encontrada.</p>
      <a href="vendas.html">Voltar para a lista de vendas</a></div>`;
    return;
  }

  const cliente = await obterCliente(venda.clienteId).catch(() => null);
  const nomeCliente = (cliente && cliente.nome) || venda.clienteNome;
  const titulo = `Venda de ${formatarData(venda.data)}`;
  document.title = `${titulo} · Assessor Coloridamente`;
  document.getElementById("migalha").textContent = titulo;
  const linkCliente = cliente
    ? `<a href="cliente.html?id=${encodeURIComponent(cliente.id)}">${esc(nomeCliente)}</a>`
    : esc(nomeCliente);

  area.innerHTML = `
    <div class="cabecalho-pagina tema-vendas">
      <div>
        <h1 class="h3 mb-0">${titulo}</h1>
        <p class="text-body-secondary mb-0">${linkCliente}${cliente && cliente.empresa ? ` · ${esc(cliente.empresa)}` : ""}</p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <a class="btn btn-outline-secondary" href="venda-form.html?id=${encodeURIComponent(venda.id)}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</a>
        <button type="button" class="btn btn-outline-danger" id="excluir"><i class="bi bi-trash" aria-hidden="true"></i> Excluir</button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-body">
            <h2 class="rotulo-secao">Produtos vendidos</h2>
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr><th>Produto</th><th class="text-center">Qtd.</th><th class="text-end">Valor unit.</th><th class="text-end">Subtotal</th></tr>
                </thead>
                <tbody>
                  ${(venda.itens || []).map((item) => `<tr>
                    <td>${esc(item.produtoNome)}</td>
                    <td class="text-center">${item.quantidade}</td>
                    <td class="text-end text-nowrap">${formatarBRL(item.valorUnitario)}</td>
                    <td class="text-end text-nowrap">${formatarBRL(item.quantidade * item.valorUnitario)}</td>
                  </tr>`).join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <th colspan="3" class="text-end border-0">Total</th>
                    <th class="text-end text-nowrap border-0 fs-5">${formatarBRL(venda.total)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card">
          <div class="card-body">
            <h2 class="rotulo-secao">Atendimento</h2>
            <dl class="dados mb-0">
              <dt>Cliente</dt><dd>${linkCliente}</dd>
              <dt>Data</dt><dd>${formatarData(venda.data)}</dd>
              <dt>Ocasião</dt><dd>${esc(nomeDaOpcao(OCASIOES, venda.ocasiao)) || "—"}</dd>
              <dt>Forma de pagamento</dt><dd>${esc(nomeDaOpcao(FORMAS_PAGAMENTO, venda.formaPagamento)) || "—"}</dd>
              <dt>Observações</dt><dd class="observacoes">${esc(venda.observacoes) || "—"}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById("excluir").addEventListener("click", async (evento) => {
    const confirmacao = `Excluir a venda de ${formatarData(venda.data)} para ${nomeCliente} (${formatarBRL(venda.total)})? Essa ação não pode ser desfeita.`;
    if (!window.confirm(confirmacao)) return;
    evento.currentTarget.disabled = true;
    try {
      await excluirVenda(venda.id);
      avisarNaProximaTela("Venda excluída.");
      window.location.href = "vendas.html";
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    }
  });
})();
