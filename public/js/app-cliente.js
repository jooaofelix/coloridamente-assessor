// Ficha do cliente: dados, histórico de compras e ações.

(async function () {
  const area = document.getElementById("cliente");
  const id = parametro("id");
  let cliente;
  let vendas;
  try {
    [cliente, vendas] = await Promise.all([obterCliente(id), listarVendas()]);
  } catch (erro) {
    area.innerHTML = "";
    mostrarErroDeCarregamento(erro);
    return;
  }
  if (!cliente) {
    area.innerHTML = `<div class="vazio"><i class="bi bi-person-x" aria-hidden="true"></i><p>Cliente não encontrado.</p>
      <a href="clientes.html">Voltar para a lista de clientes</a></div>`;
    return;
  }

  document.title = `${cliente.nome} · Assessor Coloridamente`;
  document.getElementById("migalha").textContent = cliente.nome;
  const compras = vendas.filter((v) => v.clienteId === cliente.id);
  const totalComprado = compras.reduce((soma, v) => soma + (v.total || 0), 0);
  const desde = cliente.criadoEm ? `Cliente desde ${formatarData(cliente.criadoEm)}` : "";
  const ou = (valor) => valor || "—";

  area.innerHTML = `
    <div class="cabecalho-pagina tema-clientes">
      <div>
        <h1 class="h3 mb-0">${esc(cliente.nome)}</h1>
        <p class="text-body-secondary mb-0">${[esc(cliente.empresa), desde].filter(Boolean).join(" · ")}</p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <a class="btn btn-primary" href="venda-form.html?cliente=${encodeURIComponent(cliente.id)}"><i class="bi bi-bag-plus" aria-hidden="true"></i> Nova venda</a>
        <a class="btn btn-outline-secondary" href="cliente-form.html?id=${encodeURIComponent(cliente.id)}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</a>
        <button type="button" class="btn btn-outline-danger" id="excluir"><i class="bi bi-trash" aria-hidden="true"></i> Excluir</button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="rotulo-secao">Dados do cliente</h2>
            <dl class="dados mb-0">
              <dt>WhatsApp</dt>
              <dd>${cliente.whatsapp
                ? `${esc(formatarTelefone(cliente.whatsapp))}
                   <a class="ms-1 small" href="${linkWhatsapp(cliente.whatsapp)}" target="_blank" rel="noopener">Abrir conversa<span class="visually-hidden"> (abre o WhatsApp)</span></a>`
                : "—"}</dd>
              <dt>Empresa</dt><dd>${esc(ou(cliente.empresa))}</dd>
              <dt>CPF</dt><dd>${esc(ou(formatarCpf(cliente.cpf)))}</dd>
              <dt>Aniversário</dt>
              <dd>${cliente.dataNascimento
                ? `${formatarData(cliente.dataNascimento)} <span class="text-body-secondary">(${idade(cliente.dataNascimento)} anos)</span>`
                : "—"}</dd>
              <dt>E-mail</dt><dd>${cliente.email ? `<a href="mailto:${esc(cliente.email)}">${esc(cliente.email)}</a>` : "—"}</dd>
              <dt>Endereço</dt><dd>${esc(ou(cliente.endereco))}</dd>
              <dt>Cidade/Estado</dt><dd>${esc(ou(cidadeEstado(cliente)))}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-baseline mb-3">
              <h2 class="rotulo-secao mb-0">Histórico de compras</h2>
              ${compras.length ? `<span class="small text-body-secondary">${compras.length} compra${compras.length === 1 ? "" : "s"} ·
                <strong class="text-body">${formatarBRL(totalComprado)}</strong></span>` : ""}
            </div>
            ${compras.length ? `
              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead><tr><th>Data</th><th>Produtos</th><th class="text-end">Total</th></tr></thead>
                  <tbody>
                    ${compras.map((v) => `<tr>
                      <td class="text-nowrap"><a href="venda.html?id=${encodeURIComponent(v.id)}">${formatarData(v.data)}</a></td>
                      <td>${esc(resumoDosItens(v))}</td>
                      <td class="text-end text-nowrap">${formatarBRL(v.total)}</td>
                    </tr>`).join("")}
                  </tbody>
                </table>
              </div>`
            : `<div class="vazio vazio-compacto"><i class="bi bi-bag" aria-hidden="true"></i><p>Nenhuma compra registrada para este cliente.</p></div>`}
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById("excluir").addEventListener("click", async (evento) => {
    if (compras.length) {
      mostrarAviso("Este cliente tem vendas registradas e não pode ser excluído. Exclua as vendas antes, se for mesmo necessário.", "warning");
      return;
    }
    if (!window.confirm(`Excluir o cadastro de ${cliente.nome}? Essa ação não pode ser desfeita.`)) return;
    evento.currentTarget.disabled = true;
    try {
      const resultado = await excluirCliente(cliente.id);
      if (resultado.erro) {
        mostrarAviso(resultado.erro, "warning");
        return;
      }
      avisarNaProximaTela(`Cliente ${cliente.nome} excluído.`);
      window.location.href = "clientes.html";
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    }
  });
})();
