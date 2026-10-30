// Vendas (coleção "vendas"). Cada venda guarda os produtos vendidos dentro do
// próprio registro (itens), então a venda é gravada inteira de uma vez. Nome do
// cliente e dos produtos ficam copiados na venda, como no momento da compra.

const VENDAS = "vendas";

// As mesmas ocasiões apresentadas no site da Linha Office.
const OCASIOES = [
  ["boas-vindas", "Boas-vindas à equipe"],
  ["presentes", "Presentes para clientes"],
  ["eventos", "Eventos e feiras"],
  ["dia-a-dia", "Dia a dia do escritório"],
];

const FORMAS_PAGAMENTO = [
  ["pix", "Pix"],
  ["dinheiro", "Dinheiro"],
  ["credito", "Cartão de crédito"],
  ["debito", "Cartão de débito"],
  ["outro", "Outro"],
];

function nomeDaOpcao(lista, valor) {
  const opcao = lista.find(([v]) => v === valor);
  return opcao ? opcao[1] : "";
}

async function listarVendas() {
  const vendas = await Banco.listar(VENDAS);
  return vendas.sort((a, b) =>
    (b.data || "").localeCompare(a.data || "") || (b.criadoEm || "").localeCompare(a.criadoEm || ""));
}

function obterVenda(id) {
  return Banco.obter(VENDAS, id);
}

function resumoDosItens(venda) {
  return (venda.itens || []).map((item) => `${item.quantidade}× ${item.produtoNome}`).join(", ");
}

// dados: { clienteId, data, ocasiao, formaPagamento, observacoes,
//          itens: [{ produtoId, quantidade, valorUnitario }] }
// Devolve { id } ou { erros: { campo: mensagem }, errosItens: [{ campo: mensagem }] }.
async function salvarVenda(dados, id) {
  const erros = {};
  const errosItens = [];

  const cliente = dados.clienteId ? await obterCliente(dados.clienteId) : null;
  if (!cliente) erros.clienteId = "Escolha o cliente.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data || "")) erros.data = "Informe a data.";

  const produtos = await listarProdutos();
  const itens = [];
  (dados.itens || []).forEach((linha, indice) => {
    const vazia = !linha.produtoId && !String(linha.valorUnitario || "").trim();
    if (vazia) return;
    const errosDaLinha = {};
    const produto = produtos.find((p) => p.id === linha.produtoId);
    const quantidade = Number(linha.quantidade);
    let valor = paraNumero(linha.valorUnitario);

    if (!produto) errosDaLinha.produtoId = "Escolha o produto.";
    if (!Number.isInteger(quantidade) || quantidade < 1) errosDaLinha.quantidade = "Mínimo 1.";
    if (valor === null && produto) {
      if (temPreco(produto)) valor = produto.preco;
      else errosDaLinha.valorUnitario = "Informe o valor: este produto é sob orçamento.";
    } else if (Number.isNaN(valor) || valor < 0) {
      errosDaLinha.valorUnitario = "Valor inválido.";
    }

    if (Object.keys(errosDaLinha).length) {
      errosItens[indice] = errosDaLinha;
    } else {
      itens.push({ produtoId: produto.id, produtoNome: produto.nome, quantidade, valorUnitario: arredondar(valor) });
    }
  });
  if (!itens.length && !errosItens.length) erros.itens = "Informe pelo menos um produto vendido.";

  if (Object.keys(erros).length || errosItens.length) return { erros, errosItens };

  const venda = {
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    data: dados.data,
    ocasiao: OCASIOES.some(([v]) => v === dados.ocasiao) ? dados.ocasiao : "",
    formaPagamento: FORMAS_PAGAMENTO.some(([v]) => v === dados.formaPagamento) ? dados.formaPagamento : "",
    observacoes: (dados.observacoes || "").trim(),
    itens,
    total: arredondar(itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0)),
  };
  return { id: await Banco.salvar(VENDAS, venda, id) };
}

function excluirVenda(id) {
  return Banco.excluir(VENDAS, id);
}
