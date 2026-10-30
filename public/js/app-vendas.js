// Lista de vendas, com busca por cliente, empresa ou produto.

(async function () {
  const lista = document.getElementById("lista");
  const busca = document.getElementById("busca");
  let vendas;
  let clientes;
  try {
    [vendas, clientes] = await Promise.all([listarVendas(), listarClientes()]);
  } catch (erro) {
    lista.innerHTML = "";
    mostrarErroDeCarregamento(erro);
    return;
  }
  const porId = new Map(clientes.map((c) => [c.id, c]));
  const nomeDoCliente = (v) => (porId.get(v.clienteId) || {}).nome || v.clienteNome;

  function desenhar() {
    const termo = normalizar(busca.value.trim());
    const filtradas = vendas.filter((v) => {
      if (!termo) return true;
      const cliente = porId.get(v.clienteId) || {};
      return [nomeDoCliente(v), cliente.empresa, resumoDosItens(v)].some((t) => normalizar(t).includes(termo));
    });
    const n = filtradas.length;
    document.getElementById("contagem").textContent =
      `${n} venda${n === 1 ? "" : "s"}${termo ? ` encontrada${n === 1 ? "" : "s"}` : ""}`;

    if (!n) {
      lista.innerHTML = termo
        ? `<div class="vazio"><i class="bi bi-bag-heart" aria-hidden="true"></i><p>Nenhuma venda encontrada para “${esc(busca.value.trim())}”.</p></div>`
        : `<div class="vazio"><i class="bi bi-bag-heart" aria-hidden="true"></i><p>Nenhuma venda registrada ainda.</p>
            <a class="btn btn-primary" href="venda-form.html">Registrar a primeira venda</a></div>`;
      return;
    }

    lista.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr><th>Data</th><th>Cliente</th><th>Produtos</th><th>Ocasião</th><th class="text-end">Total</th></tr>
          </thead>
          <tbody>
            ${filtradas.map((v) => {
              const cliente = porId.get(v.clienteId) || {};
              return `<tr>
                <td class="text-nowrap"><a class="fw-bold" href="venda.html?id=${encodeURIComponent(v.id)}">${formatarData(v.data)}</a></td>
                <td>
                  ${esc(nomeDoCliente(v))}
                  ${cliente.empresa ? `<span class="d-block small text-body-secondary">${esc(cliente.empresa)}</span>` : ""}
                </td>
                <td>${esc(resumoDosItens(v))}</td>
                <td class="small">${esc(nomeDaOpcao(OCASIOES, v.ocasiao)) || "—"}</td>
                <td class="text-end text-nowrap fw-semibold">${formatarBRL(v.total)}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;
  }

  busca.addEventListener("input", desenhar);
  desenhar();
})();
