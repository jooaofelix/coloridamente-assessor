// Cadastro e edição de produto (produto-form.html e produto-form.html?id=...).

(async function () {
  const formulario = document.getElementById("form-produto");
  const id = parametro("id");
  formulario.querySelector("[data-campos]").innerHTML = htmlCamposProduto("produto", true);

  if (id) {
    let produto;
    try {
      produto = await obterProduto(id);
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
      return;
    }
    if (!produto) {
      mostrarAviso("Produto não encontrado.", "warning");
      formulario.hidden = true;
      return;
    }
    document.querySelectorAll("[data-titulo]").forEach((e) => { e.textContent = "Editar produto"; });
    document.title = `Editar ${produto.nome} · Assessor Coloridamente`;
    preencherFormulario(formulario, Object.assign({}, produto, { preco: formatarPrecoParaCampo(produto.preco) }));
  }
  formulario.querySelector('[name="nome"]').focus();

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formulario);
    const botao = formulario.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const resultado = await salvarProduto(dadosDoFormulario(formulario), id);
      if (resultado.erros) {
        mostrarErros(formulario, resultado.erros);
        return;
      }
      avisarNaProximaTela(id ? `Produto ${resultado.produto.nome} atualizado.` : `Produto ${resultado.produto.nome} cadastrado.`);
      window.location.href = "produtos.html";
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    } finally {
      botao.disabled = false;
    }
  });
})();
