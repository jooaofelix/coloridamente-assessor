// Lista de produtos, com busca, filtro por categoria e ações de editar/excluir.

(async function () {
  const lista = document.getElementById("lista");
  const busca = document.getElementById("busca");
  const filtros = document.getElementById("filtros");
  let categoriaAtual = parametro("categoria") || "";
  let produtos;
  let vendas;

  async function carregar() {
    [produtos, vendas] = await Promise.all([listarProdutos(), listarVendas()]);
  }

  function quantidadeVendida(produto) {
    return vendas.reduce((soma, v) => soma + (v.itens || [])
      .filter((item) => item.produtoId === produto.id)
      .reduce((s, item) => s + item.quantidade, 0), 0);
  }

  function desenharFiltros() {
    filtros.innerHTML = [["", "Todas"], ...CATEGORIAS].map(([valor, nome]) =>
      `<button type="button" class="filtro ${valor === categoriaAtual ? "ativo" : ""}" data-categoria="${valor}"
         aria-pressed="${valor === categoriaAtual}">${esc(nome)}</button>`).join("");
  }

  function desenhar() {
    const termo = normalizar(busca.value.trim());
    const filtrados = produtos.filter((p) =>
      (!categoriaAtual || p.categoria === categoriaAtual) &&
      (!termo || normalizar(p.nome).includes(termo) || normalizar(p.descricao).includes(termo)));
    const n = filtrados.length;
    document.getElementById("contagem").textContent = `${n} produto${n === 1 ? "" : "s"}`;

    if (!n) {
      lista.innerHTML = termo || categoriaAtual
        ? `<div class="vazio"><i class="bi bi-box-seam" aria-hidden="true"></i><p>Nenhum produto encontrado.</p></div>`
        : `<div class="vazio"><i class="bi bi-box-seam" aria-hidden="true"></i><p>Nenhum produto cadastrado ainda.</p>
            <a class="btn btn-primary" href="produto-form.html">Cadastrar o primeiro produto</a></div>`;
      return;
    }

    lista.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr><th>Produto</th><th>Categoria</th><th class="text-end">Preço</th><th class="text-center">Vendidos</th><th>Situação</th><th></th></tr>
          </thead>
          <tbody>
            ${filtrados.map((p) => `<tr class="${p.ativo === false ? "text-body-secondary" : ""}">
              <td>
                <span class="fw-bold">${esc(p.nome)}</span>
                ${p.descricao ? `<span class="d-block small text-body-secondary text-truncate descricao-produto">${esc(p.descricao)}</span>` : ""}
              </td>
              <td class="text-nowrap small">${esc(nomeCategoria(p.categoria)) || "—"}</td>
              <td class="text-end text-nowrap">${temPreco(p) ? formatarBRL(p.preco) : '<span class="text-body-secondary">Sob orçamento</span>'}</td>
              <td class="text-center">${quantidadeVendida(p)}</td>
              <td>${p.ativo === false
                ? '<span class="badge selo">Fora de venda</span>'
                : '<span class="badge selo selo-disponivel">Disponível</span>'}</td>
              <td class="text-end text-nowrap">
                <a class="btn btn-sm btn-outline-secondary" href="produto-form.html?id=${encodeURIComponent(p.id)}" title="Editar ${esc(p.nome)}">
                  <i class="bi bi-pencil" aria-hidden="true"></i><span class="visually-hidden">Editar ${esc(p.nome)}</span></a>
                <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${esc(p.id)}" title="Excluir ${esc(p.nome)}">
                  <i class="bi bi-trash" aria-hidden="true"></i><span class="visually-hidden">Excluir ${esc(p.nome)}</span></button>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  filtros.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-categoria]");
    if (!botao) return;
    categoriaAtual = botao.dataset.categoria;
    desenharFiltros();
    desenhar();
  });

  lista.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("[data-excluir]");
    if (!botao) return;
    const produto = produtos.find((p) => p.id === botao.dataset.excluir);
    if (!produto || !window.confirm(`Excluir o produto “${produto.nome}”? Essa ação não pode ser desfeita.`)) return;
    botao.disabled = true;
    try {
      const resultado = await excluirProduto(produto.id);
      if (resultado.erro) {
        mostrarAviso(resultado.erro, "warning");
      } else {
        mostrarAviso(`Produto ${produto.nome} excluído.`);
        await carregar();
        desenhar();
      }
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    } finally {
      botao.disabled = false;
    }
  });

  busca.addEventListener("input", desenhar);
  desenharFiltros();
  try {
    await carregar();
  } catch (erro) {
    lista.innerHTML = "";
    mostrarErroDeCarregamento(erro);
    return;
  }
  desenhar();
})();
