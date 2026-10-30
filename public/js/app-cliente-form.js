// Cadastro e edição de cliente (cliente-form.html e cliente-form.html?id=...).

(async function () {
  const formulario = document.getElementById("form-cliente");
  const id = parametro("id");
  formulario.querySelector("[data-campos]").innerHTML = htmlCamposCliente("cliente");
  aplicarMascaras(formulario);

  if (id) {
    let cliente;
    try {
      cliente = await obterCliente(id);
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
      return;
    }
    if (!cliente) {
      mostrarAviso("Cliente não encontrado.", "warning");
      formulario.hidden = true;
      return;
    }
    document.querySelectorAll("[data-titulo]").forEach((e) => { e.textContent = "Editar cliente"; });
    document.title = `Editar ${cliente.nome} · Assessor Coloridamente`;
    document.getElementById("cancelar").href = `cliente.html?id=${encodeURIComponent(id)}`;
    preencherFormulario(formulario, Object.assign({}, cliente, {
      cpf: formatarCpf(cliente.cpf),
      whatsapp: formatarTelefone(cliente.whatsapp),
    }));
  }
  formulario.querySelector('[name="nome"]').focus();

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErros(formulario);
    const botao = formulario.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const resultado = await salvarCliente(dadosDoFormulario(formulario), id);
      if (resultado.erros) {
        mostrarErros(formulario, resultado.erros);
        return;
      }
      avisarNaProximaTela(id ? `Dados de ${resultado.cliente.nome} atualizados.` : `Cliente ${resultado.cliente.nome} cadastrado.`);
      window.location.href = `cliente.html?id=${encodeURIComponent(resultado.id)}`;
    } catch (erro) {
      mostrarErroDeCarregamento(erro);
    } finally {
      botao.disabled = false;
    }
  });
})();
