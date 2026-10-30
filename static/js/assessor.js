(function () {
  "use strict";

  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  // Máscara de CPF: 000.000.000-00
  document.querySelectorAll('[data-mascara="cpf"]').forEach(function (campo) {
    campo.addEventListener("input", function () {
      var d = campo.value.replace(/\D/g, "").slice(0, 11);
      var partes = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join(".");
      campo.value = d.length > 9 ? partes + "-" + d.slice(9) : partes;
    });
  });

  // Ao abrir uma janela de cadastro, o cursor já vai para o primeiro campo.
  document.addEventListener("shown.bs.modal", function (evento) {
    var campo = evento.target.querySelector("input:not([type=hidden]), select, textarea");
    if (campo) campo.focus();
  });

  // Cadastro rápido (cliente/produto) sem sair da tela atual
  function limparErros(formulario) {
    formulario.querySelectorAll(".is-invalid").forEach(function (c) { c.classList.remove("is-invalid"); });
    formulario.querySelectorAll("[data-erro-campo]").forEach(function (e) { e.remove(); });
    formulario.querySelector("[data-erro-geral]").classList.add("d-none");
  }

  function mostrarErroGeral(formulario, texto) {
    var alerta = formulario.querySelector("[data-erro-geral]");
    alerta.textContent = texto;
    alerta.classList.remove("d-none");
  }

  function mostrarErros(formulario, erros) {
    var prefixo = formulario.dataset.prefixo;
    Object.keys(erros).forEach(function (nome) {
      var mensagens = erros[nome].map(function (e) { return e.message; }).join(" ");
      var campo = formulario.querySelector('[name="' + prefixo + "-" + nome + '"]');
      if (!campo) {
        mostrarErroGeral(formulario, mensagens);
        return;
      }
      campo.classList.add("is-invalid");
      var aviso = document.createElement("div");
      aviso.className = "invalid-feedback";
      aviso.dataset.erroCampo = "";
      aviso.textContent = mensagens;
      campo.insertAdjacentElement("afterend", aviso);
    });
  }

  document.querySelectorAll("form[data-cadastro-rapido]").forEach(function (formulario) {
    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
      limparErros(formulario);
      var botao = formulario.querySelector('[type="submit"]');
      botao.disabled = true;
      fetch(formulario.action, {
        method: "POST",
        body: new FormData(formulario),
        headers: { "X-Requested-With": "XMLHttpRequest" },
        credentials: "same-origin"
      })
        .then(function (resposta) { return resposta.json(); })
        .then(function (dados) {
          if (!dados.ok) {
            mostrarErros(formulario, dados.erros);
            return;
          }
          document.dispatchEvent(new CustomEvent("cadastro-rapido", {
            detail: Object.assign({ tipo: formulario.dataset.cadastroRapido }, dados)
          }));
          formulario.reset();
          bootstrap.Modal.getOrCreateInstance(formulario.closest(".modal")).hide();
        })
        .catch(function () {
          mostrarErroGeral(formulario, "Não foi possível salvar. Verifique a conexão e tente de novo.");
        })
        .finally(function () { botao.disabled = false; });
    });
  });

  // Formulário de venda: produtos vendidos (formset do Django)
  var form = document.querySelector("[data-form-venda]");
  if (!form) return;

  var lista = form.querySelector("[data-itens]");
  var modelo = form.querySelector("template[data-modelo-item]");
  var totalForms = form.querySelector('input[name$="-TOTAL_FORMS"]');
  var campoTotal = form.querySelector("[data-total]");
  var seletorCliente = form.querySelector('select[name="cliente"]');

  function numero(campo) {
    var valor = parseFloat(String(campo && campo.value || "").replace(",", "."));
    return isNaN(valor) ? 0 : valor;
  }

  function removido(item) {
    var excluir = item.querySelector('input[name$="-DELETE"]');
    return excluir && excluir.checked;
  }

  function itensVisiveis() {
    return Array.prototype.filter.call(lista.querySelectorAll("[data-item]"), function (i) {
      return !removido(i);
    });
  }

  function recalcular() {
    var total = 0;
    lista.querySelectorAll("[data-item]").forEach(function (item) {
      var subtotal = numero(item.querySelector('[data-campo="quantidade"]')) *
                     numero(item.querySelector('[data-campo="valor"]'));
      item.querySelector("[data-subtotal]").textContent = moeda.format(subtotal);
      if (!removido(item)) total += subtotal;
    });
    campoTotal.textContent = moeda.format(total);
  }

  // Ao escolher o produto, o valor unitário vem do cadastro (dá para alterar).
  function aplicarPreco(item) {
    var seletor = item.querySelector('[data-campo="produto"]');
    var opcao = seletor.options[seletor.selectedIndex];
    if (opcao && opcao.dataset.preco) {
      item.querySelector('[data-campo="valor"]').value = opcao.dataset.preco;
    }
  }

  function adicionarItem() {
    var indice = parseInt(totalForms.value, 10);
    lista.insertAdjacentHTML("beforeend", modelo.innerHTML.replace(/__prefix__/g, indice));
    totalForms.value = indice + 1;
    return lista.lastElementChild;
  }

  form.querySelector("[data-adicionar-item]").addEventListener("click", function () {
    adicionarItem().querySelector('[data-campo="produto"]').focus();
    recalcular();
  });

  lista.addEventListener("click", function (evento) {
    var botao = evento.target.closest("[data-remover]");
    if (!botao) return;
    var item = botao.closest("[data-item]");
    if (itensVisiveis().length <= 1) {
      // Mantém sempre uma linha: em vez de remover, apenas limpa.
      item.querySelector('[data-campo="produto"]').value = "";
      item.querySelector('[data-campo="quantidade"]').value = "1";
      item.querySelector('[data-campo="valor"]').value = "";
    } else {
      item.querySelector('input[name$="-DELETE"]').checked = true;
      item.classList.add("d-none");
    }
    recalcular();
  });

  lista.addEventListener("change", function (evento) {
    if (evento.target.matches('[data-campo="produto"]')) {
      aplicarPreco(evento.target.closest("[data-item]"));
      recalcular();
    }
  });
  lista.addEventListener("input", recalcular);

  // Cliente ou produto recém-cadastrado já entra selecionado na venda.
  document.addEventListener("cadastro-rapido", function (evento) {
    var dados = evento.detail;
    if (dados.tipo === "cliente") {
      seletorCliente.add(new Option(dados.nome, dados.id, true, true));
      seletorCliente.classList.remove("is-invalid");
      return;
    }
    if (dados.tipo !== "produto") return;

    var seletores = Array.prototype.slice.call(lista.querySelectorAll('[data-campo="produto"]'));
    seletores.push(modelo.content.querySelector('[data-campo="produto"]'));
    seletores.forEach(function (seletor) {
      var opcao = new Option(dados.nome, dados.id);
      opcao.dataset.preco = dados.preco;
      seletor.add(opcao);
    });

    var destino = itensVisiveis().filter(function (item) {
      return !item.querySelector('[data-campo="produto"]').value;
    })[0] || adicionarItem();
    destino.querySelector('[data-campo="produto"]').value = dados.id;
    aplicarPreco(destino);
    recalcular();
  });

  lista.querySelectorAll("[data-item]").forEach(function (item) {
    if (removido(item)) item.classList.add("d-none");
  });
  recalcular();
})();
