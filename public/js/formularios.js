// Campos dos formulários de cliente e de produto. Ficam aqui porque aparecem
// em dois lugares: na página de cadastro e na janela de cadastro rápido da venda.

function rotuloHtml(id, rotulo, obrigatorio) {
  const marca = obrigatorio ? ' <span class="text-danger" title="obrigatório">*</span>' : "";
  return `<label class="form-label" for="${id}">${rotulo}${marca}</label>`;
}

function ajudaHtml(ajuda) {
  return ajuda ? `<div class="form-text">${ajuda}</div>` : "";
}

function campoHtml({ id, nome, rotulo, tipo, obrigatorio, classe, atributos, ajuda }) {
  return `<div class="${classe || "col-12"}">
    ${rotuloHtml(id, rotulo, obrigatorio)}
    <input class="form-control" type="${tipo || "text"}" id="${id}" name="${nome}" ${atributos || ""}>
    ${ajudaHtml(ajuda)}
  </div>`;
}

function opcoesHtml(opcoes, vazio) {
  const primeira = vazio ? `<option value="">${vazio}</option>` : "";
  return primeira + opcoes.map(([valor, texto]) => `<option value="${esc(valor)}">${esc(texto)}</option>`).join("");
}

function selectHtml({ id, nome, rotulo, opcoes, vazio, classe, obrigatorio }) {
  return `<div class="${classe || "col-12"}">
    ${rotuloHtml(id, rotulo, obrigatorio)}
    <select class="form-select" id="${id}" name="${nome}">${opcoesHtml(opcoes, vazio)}</select>
  </div>`;
}

function textoLongoHtml({ id, nome, rotulo, classe, atributos }) {
  return `<div class="${classe || "col-12"}">
    ${rotuloHtml(id, rotulo)}
    <textarea class="form-control" id="${id}" name="${nome}" rows="3" ${atributos || ""}></textarea>
  </div>`;
}

function htmlCamposCliente(prefixo) {
  const id = (nome) => `${prefixo}-${nome}`;
  return `
    <h2 class="rotulo-secao">Dados do cliente</h2>
    <div class="row g-3 mb-4">
      ${campoHtml({ id: id("nome"), nome: "nome", rotulo: "Nome", obrigatorio: true, classe: "col-md-7", atributos: 'autocomplete="off"' })}
      ${campoHtml({ id: id("empresa"), nome: "empresa", rotulo: "Empresa", classe: "col-md-5",
        ajuda: "Empresa que a pessoa representa, quando o pedido é corporativo." })}
      ${campoHtml({ id: id("cpf"), nome: "cpf", rotulo: "CPF", classe: "col-sm-6 col-lg-3",
        atributos: 'inputmode="numeric" maxlength="14" placeholder="000.000.000-00" data-mascara="cpf"' })}
      ${campoHtml({ id: id("dataNascimento"), nome: "dataNascimento", rotulo: "Data de aniversário", tipo: "date", classe: "col-sm-6 col-lg-3" })}
      ${campoHtml({ id: id("whatsapp"), nome: "whatsapp", rotulo: "WhatsApp", tipo: "tel", classe: "col-sm-6 col-lg-3",
        atributos: 'inputmode="tel" placeholder="(00) 00000-0000" data-mascara="telefone"' })}
      ${campoHtml({ id: id("email"), nome: "email", rotulo: "E-mail", tipo: "email", classe: "col-sm-6 col-lg-3",
        atributos: 'placeholder="nome@exemplo.com"' })}
    </div>
    <h2 class="rotulo-secao">Endereço</h2>
    <div class="row g-3">
      ${campoHtml({ id: id("endereco"), nome: "endereco", rotulo: "Endereço", atributos: 'placeholder="Rua, número, complemento, bairro"' })}
      ${campoHtml({ id: id("cidade"), nome: "cidade", rotulo: "Cidade", classe: "col-sm-8" })}
      ${selectHtml({ id: id("estado"), nome: "estado", rotulo: "Estado", opcoes: ESTADOS, vazio: "Selecione…", classe: "col-sm-4" })}
    </div>`;
}

function htmlCamposProduto(prefixo, comDisponibilidade) {
  const id = (nome) => `${prefixo}-${nome}`;
  const disponivel = comDisponibilidade ? `
      <div class="col-12">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="${id("ativo")}" name="ativo" checked>
          <label class="form-check-label" for="${id("ativo")}">Disponível para venda</label>
          <div class="form-text">Desmarque para tirar o produto da lista de venda sem apagar o histórico.</div>
        </div>
      </div>` : "";
  return `
    <div class="row g-3">
      ${campoHtml({ id: id("nome"), nome: "nome", rotulo: "Nome", obrigatorio: true, atributos: 'autocomplete="off"' })}
      ${selectHtml({ id: id("categoria"), nome: "categoria", rotulo: "Categoria", opcoes: CATEGORIAS, vazio: "Sem categoria", classe: "col-sm-7" })}
      ${campoHtml({ id: id("preco"), nome: "preco", rotulo: "Preço (R$)", tipo: "text", classe: "col-sm-5",
        atributos: 'inputmode="decimal" placeholder="Sob orçamento"',
        ajuda: "Deixe em branco se o valor depende do orçamento." })}
      ${textoLongoHtml({ id: id("descricao"), nome: "descricao", rotulo: "Descrição" })}
      ${disponivel}
    </div>`;
}

// Preenche os campos do formulário pelo atributo name.
function preencherFormulario(formulario, dados) {
  Object.keys(dados).forEach((nome) => {
    const campo = formulario.querySelector(`[name="${nome}"]`);
    if (!campo) return;
    if (campo.type === "checkbox") campo.checked = dados[nome] !== false;
    else campo.value = dados[nome] == null ? "" : dados[nome];
  });
}

function formatarPrecoParaCampo(preco) {
  return typeof preco === "number" ? preco.toFixed(2).replace(".", ",") : "";
}
