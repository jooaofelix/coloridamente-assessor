// Produtos (coleção "produtos"). O preço é opcional: na Coloridamente o valor
// costuma sair do orçamento (produto, quantidade e personalização).

const PRODUTOS = "produtos";

// As mesmas categorias do site da Linha Office.
const CATEGORIAS = [
  ["agendas-e-cadernos", "Agendas e cadernos"],
  ["papelaria-corporativa", "Papelaria corporativa"],
  ["brindes-personalizados", "Brindes personalizados"],
  ["acessorios-para-escritorio", "Acessórios para escritório"],
];

// Itens da Linha Office, com nome e descrição iguais aos do site. Sem preço:
// nada de valor inventado.
const LINHA_OFFICE = [
  {
    id: "agenda-2027",
    nome: "Agenda 2027",
    categoria: "agendas-e-cadernos",
    descricao: "Agenda diária com horários, minicalendário do mês e quadro de anotações, com a marca na capa.",
  },
  {
    id: "kit-acessorios-escritorio",
    nome: "Kit de acessórios para escritório",
    categoria: "acessorios-para-escritorio",
    descricao: "Suporte de celular, porta-lápis, bandeja oval e porta-clipes em preto, com acabamento canelado.",
  },
  {
    id: "caderno-espiral-capa",
    nome: "Caderno com capa personalizada",
    categoria: "agendas-e-cadernos",
    descricao: "Capa branca com a marca e ondas em tons de azul, com encadernação em espiral.",
  },
  {
    id: "caderno-aberto-pautado",
    nome: "Caderno pautado personalizado",
    categoria: "agendas-e-cadernos",
    descricao: "Folhas pautadas com a marca no topo e o grafismo da capa nos cantos. Também disponível com folhas sem pauta.",
  },
];

function nomeCategoria(valor) {
  const categoria = CATEGORIAS.find(([v]) => v === valor);
  return categoria ? categoria[1] : "";
}

// Cadastra a Linha Office uma única vez (se alguém excluir um item depois,
// ele não volta sozinho).
let catalogoGarantido = null;
function garantirLinhaOffice() {
  catalogoGarantido = catalogoGarantido || (async function () {
    const config = await Banco.obter("configuracoes", "catalogo");
    if (config && config.linhaOfficeCadastrada) return;
    for (const item of LINHA_OFFICE) {
      if (!(await Banco.obter(PRODUTOS, item.id))) {
        await Banco.salvar(PRODUTOS, {
          nome: item.nome,
          categoria: item.categoria,
          descricao: item.descricao,
          preco: null,
          ativo: true,
        }, item.id);
      }
    }
    await Banco.salvar("configuracoes", { linhaOfficeCadastrada: true }, "catalogo");
  })();
  return catalogoGarantido;
}

async function listarProdutos() {
  await garantirLinhaOffice();
  const produtos = await Banco.listar(PRODUTOS);
  return produtos.sort((a, b) => (b.ativo !== false) - (a.ativo !== false) || (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}

function obterProduto(id) {
  return Banco.obter(PRODUTOS, id);
}

function temPreco(produto) {
  return produto && typeof produto.preco === "number";
}

// Valida e salva. Devolve { id, produto } ou { erros: { campo: mensagem } }.
async function salvarProduto(dados, id) {
  const preco = paraNumero(dados.preco);
  const produto = {
    nome: String(dados.nome || "").trim().replace(/\s+/g, " "),
    categoria: CATEGORIAS.some(([v]) => v === dados.categoria) ? dados.categoria : "",
    preco: preco === null || Number.isNaN(preco) ? null : arredondar(preco),
    descricao: (dados.descricao || "").trim(),
    ativo: dados.ativo !== false,
  };

  const erros = {};
  if (!produto.nome) {
    erros.nome = "Informe o nome do produto.";
  } else {
    const outros = await listarProdutos();
    if (outros.some((p) => p.id !== id && normalizar(p.nome) === normalizar(produto.nome))) {
      erros.nome = "Já existe um produto com este nome.";
    }
  }
  if (Number.isNaN(preco) || (preco !== null && preco < 0)) erros.preco = "Informe um preço válido, ou deixe em branco.";
  if (Object.keys(erros).length) return { erros };

  const novoId = await Banco.salvar(PRODUTOS, produto, id);
  return { id: novoId, produto: Object.assign({ id: novoId }, produto) };
}

// Produto que já aparece em vendas não pode ser excluído; dá para tirá-lo da venda.
async function excluirProduto(id) {
  const vendas = await listarVendas();
  if (vendas.some((v) => (v.itens || []).some((item) => item.produtoId === id))) {
    return { erro: "Este produto já aparece em vendas e não pode ser excluído. Para tirá-lo da lista de venda, edite e desmarque “Disponível para venda”." };
  }
  await Banco.excluir(PRODUTOS, id);
  return {};
}
