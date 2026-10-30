// Registrar e editar venda (venda-form.html; ?id= para editar, ?cliente= para
// já abrir com o cliente escolhido). Inclui o cadastro rápido de cliente e de
// produto sem sair da tela.

(async function () {
  const formulario = document.getElementById("form-venda");
  const listaItens = document.getElementById("itens");
  const seletorCliente = document.getElementById("venda-cliente");
  const campoTotal = document.getElementById("total");
  const erroItens = document.getElementById("erro-itens");
  const formCliente = document.getElementById("form-novo-cliente");
  const formProduto = document.getElementById("form-novo-produto");
  const id = parametro("id");

  let clientes = [];
  let produtos = []; // os disponíveis para venda, mais os que já estão nesta venda
  let contador = 0;

  document.getElementById("venda-pagamento").innerHTML = opcoesHtml(FORMAS_PAGAMENTO, "Não informada");
  document.getElementById("venda-ocasiao").innerHTML = opcoesHtml(OCASIOES, "Não informada");
  document.getElementById("venda-data").value = hojeISO();
  formCliente.querySelector("[data-campos]").innerHTML = htmlCamposCliente("novo-cliente");
  formProduto.querySelector("[data-campos]").innerHTML = htmlCamposProduto("novo-produto", false);
  aplicarMascaras(formCliente);

  // ---- Linhas de produtos vendidos

  function rotuloDoProduto(p) {
    return temPreco(p) ? p.nome : `${p.nome} (sob orçamento)`;
  }

  function opcaoDeProduto(p, selecionado) {
    const preco = temPreco(p) ? ` data-preco="${p.preco}"` : "";
    return `<option value="${esc(p.id)}"${preco}${p.id === selecionado ? " selected" : ""}>${esc(rotuloDoProduto(p))}</option>`;
  }

  function linhaHtml(item) {
    const n = contador++;
    const valor = item.valorUnitario == null ? "" : formatarPrecoParaCampo(item.valorUnitario);
    return `<div class="item-venda row g-2 align-items-start" data-item>
      <div class="col-12 col-md-5">
        <label class="form-label small d-md-none" for="item-${n}-produto">Produto</label>
        <select class="form-select" id="item-${n}-produto" name="produtoId" aria-label="Produto">
          <option value="">Escolha o produto…</option>
          ${produtos.map((p) => opcaoDeProduto(p, item.produtoId)).join("")}
        </select>
      </div>
      <div class="col-3 col-md-2">
        <label class="form-label small d-md-none" for="item-${n}-quantidade">Qtd.</label>
        <input class="form-control" type="number" min="1" step="1" id="item-${n}-quantidade" name="quantidade"
               value="${item.quantidade || 1}" aria-label="Quantidade">
      </div>
      <div class="col-5 col-md-2">
        <label class="form-label small d-md-none" for="item-${n}-valor">Valor unit. (R$)</label>
        <input class="form-control" type="text" inputmode="decimal" id="item-${n}-valor" name="valorUnitario"
               value="${valor}" placeholder="0,00" aria-label="Valor unitário (R$)">
      </div>
      <div class="col-4 col-md-2 text-end">
        <span class="form-label small d-md-none d-block">Subtotal</span>
        <span class="subtotal" data-subtotal>R$ 0,00</span>
      </div>
      <div class="col-12 col-md-1 text-end">
        <button type="button" class="btn btn-sm btn-outline-danger botao-remover" data-remover title="Remover produto" aria-label="Remover produto">
          <i class="bi bi-trash" aria-hidden="true"></i><span class="d-md-none"> Remover</span>
        </button>
      </div>
    </div>`;
  }

  function adicionarLinha(item) {
    listaItens.insertAdjacentHTML("beforeend", linhaHtml(item || {}));
    return listaItens.lastElementChild;
  }

  function recalcular() {
    let total = 0;
    listaItens.querySelectorAll("[data-item]").forEach((linha) => {
      const quantidade = Number(linha.querySelector('[name="quantidade"]').value) || 0;
      const valor = paraNumero(linha.querySelector('[name="valorUnitario"]').value) || 0;
      const subtotal = quantidade * valor;
      linha.querySelector("[data-subtotal]").textContent = formatarBRL(subtotal);
      total += subtotal;
    });
    campoTotal.textContent = formatarBRL(total);
  }

  // Ao escolher o produto, o valor vem do cadastro (dá para alterar). Produto
  // sob orçamento deixa o valor em branco, com o cursor nele.
  function aplicarPreco(linha) {
    const seletor = linha.querySelector('[name="produtoId"]');
    const opcao = seletor.options[seletor.selectedIndex];
    const campoValor = linha.querySelector('[name="valorUnitario"]');
    campoValor.value = opcao && opcao.dataset.preco ? formatarPrecoParaCampo(Number(opcao.dataset.preco)) : "";
    if (opcao && opcao.value && !opcao.dataset.preco) campoValor.focus();
  }

  document.getElementById("adicionar-item").addEventListener("click", () => {
    adicionarLinha().querySelector('[name="produtoId"]').focus();
    recalcular();
  });

  listaItens.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-remover]");
    if (!botao) return;
    const linha = botao.closest("[data-item]");
    if (listaItens.children.length > 1) {
      linha.remove();
    } else {
      // Mantém sempre uma linha: em vez de remover, apenas limpa.
      linha.querySelector('[name="produtoId"]').value = "";
      linha.querySelector('[name="quantidade"]').value = "1";
      linha.querySelector('[name="valorUnitario"]').value = "";
    }
    recalcular();
  });

  listaItens.addEventListener("change", (evento) => {
    if (evento.target.name === "produtoId") {
      aplicarPreco(evento.target.closest("[data-item]"));
      recalcular();
    }
  });
  listaItens.addEventListener("input", recalcular);

  // ---- Carregamento

  let venda = null;
  try {
    let todosOsProdutos;
    [clientes, todosOsProdutos] = await Promise.all([listarClientes(), listarProdutos()]);
    if (id) venda = await obterVenda(id);
    const jaNaVenda = new Set(((venda && venda.itens) || []).map((item) => item.produtoId));
    produtos = todosOsProdutos.filter((p) => p.ativo !== false || jaNaVenda.has(p.id));
  } catch (erro) {
    mostrarErroDeCarregamento(erro);
    return;
  }
  if (id && !venda) {
    mostrarAviso("Venda não encontrada.", "warning");
    formulario.hidden = true;
    return;
  }

  const rotuloDoCliente = (c) => (c.empresa ? `${c.nome} — ${c.empresa}` : c.nome);
  seletorCliente.innerHTML = `<option value="">Escolha o cliente…</option>` +
    clientes.map((c) => `<option value="${esc(c.id)}">${esc(rotuloDoCliente(c))}</option>`).join("");

  if (venda) {
    const titulo = `Editar venda de ${formatarData(venda.data)}`;
    document.querySelectorAll("[data-titulo]").forEach((e) => { e.textContent = titulo; });
    document.title = `${titulo} · Assessor Coloridamente`;
    document.getElementById("cancelar").href = `venda.html?id=${encodeURIComponent(venda.id)}`;
    preencherFormulario(formulario, {
      clienteId: venda.clienteId,
      data: venda.data,
      ocasiao: venda.ocasiao,
      formaPagamento: venda.formaPagamento,
      observacoes: venda.observacoes,
    });
    venda.itens.forEach((item) => adicionarLinha(item));
  } else {
    const clienteEscolhido = parametro("cliente");
    if (clientes.some((c) => c.id === clienteEscolhido)) seletorCliente.value = clienteEscolhido;
    adicionarLinha();
  }
  recalcular();

  // ---- Salvar

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formulario);
    erroItens.classList.add("d-none");
    const linhas = Array.from(listaItens.querySelectorAll("[data-item]"));
    const campo = (nome) => formulario.querySelector(`[name="${nome}"]`).value;
    const dados = {
      clienteId: campo("clienteId"),
      data: campo("data"),
      ocasiao: campo("ocasiao"),
      formaPagamento: campo("formaPagamento"),
      observacoes: campo("observacoes"),
      itens: linhas.map((linha) => ({
        produtoId: linha.querySelector('[name="produtoId"]').value,
        quantidade: linha.querySelector('[name="quantidade"]').value,
        valorUnitario: linha.querySelector('[name="valorUnitario"]').value,
      })),
    };

    const botao = formulario.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const resultado = await salvarVenda(dados, id);
      if (resultado.erros) {
        const { itens: erroDosItens, ...demais } = resultado.erros;
        let primeiro = mostrarErros(formulario, demais);
        if (erroDosItens) {
          erroItens.textContent = erroDosItens;
          erroItens.classList.remove("d-none");
        }
        resultado.errosItens.forEach((errosDaLinha, indice) => {
          Object.keys(errosDaLinha || {}).forEach((nome) => {
            const campoComErro = linhas[indice].querySelector(`[name="${nome}"]`);
            marcarErro(campoComErro, errosDaLinha[nome]);
            primeiro = primeiro || campoComErro;
          });
        });
        if (primeiro) primeiro.focus();
        return;
      }
      avisarNaProximaTela(id ? "Venda atualizada." : "Venda registrada.");
      window.location.href = `venda.html?id=${encodeURIComponent(resultado.id)}`;
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    } finally {
      botao.disabled = false;
    }
  });

  // ---- Cadastro rápido (cliente e produto) sem sair da venda

  document.addEventListener("shown.bs.modal", (evento) => {
    const primeiro = evento.target.querySelector("input, select, textarea");
    if (primeiro) primeiro.focus();
  });

  function fecharJanela(formularioDaJanela) {
    formularioDaJanela.reset();
    limparErros(formularioDaJanela);
    bootstrap.Modal.getOrCreateInstance(formularioDaJanela.closest(".modal")).hide();
  }

  formCliente.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formCliente);
    const botao = formCliente.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const resultado = await salvarCliente(dadosDoFormulario(formCliente));
      if (resultado.erros) {
        mostrarErros(formCliente, resultado.erros);
        return;
      }
      clientes.push(resultado.cliente);
      seletorCliente.add(new Option(rotuloDoCliente(resultado.cliente), resultado.id, true, true));
      seletorCliente.classList.remove("is-invalid");
      formulario.querySelectorAll("[data-erro]").forEach((e) => {
        if (e.previousElementSibling && e.previousElementSibling.contains(seletorCliente)) e.remove();
      });
      fecharJanela(formCliente);
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    } finally {
      botao.disabled = false;
    }
  });

  formProduto.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formProduto);
    const botao = formProduto.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const resultado = await salvarProduto(dadosDoFormulario(formProduto));
      if (resultado.erros) {
        mostrarErros(formProduto, resultado.erros);
        return;
      }
      const produto = resultado.produto;
      produtos.push(produto);
      listaItens.querySelectorAll('[name="produtoId"]').forEach((seletor) => {
        seletor.insertAdjacentHTML("beforeend", opcaoDeProduto(produto));
      });
      // O produto novo entra na primeira linha vazia (ou numa linha nova).
      const linhaVazia = Array.from(listaItens.querySelectorAll("[data-item]"))
        .find((linha) => !linha.querySelector('[name="produtoId"]').value);
      const linha = linhaVazia || adicionarLinha();
      linha.querySelector('[name="produtoId"]').value = produto.id;
      fecharJanela(formProduto);
      aplicarPreco(linha);
      recalcular();
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    } finally {
      botao.disabled = false;
    }
  });
})();
