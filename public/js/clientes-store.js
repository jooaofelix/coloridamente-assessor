// Clientes (coleção "clientes"). CPF e WhatsApp são guardados só com dígitos.

const CLIENTES = "clientes";

const ESTADOS = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"],
  ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"],
  ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"],
  ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"], ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"],
  ["SE", "Sergipe"], ["TO", "Tocantins"],
];

async function listarClientes() {
  const clientes = await Banco.listar(CLIENTES);
  return clientes.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
}

function obterCliente(id) {
  return Banco.obter(CLIENTES, id);
}

function cidadeEstado(cliente) {
  return [cliente.cidade, cliente.estado].filter(Boolean).join("/");
}

// Valida e salva. Devolve { id, cliente } ou { erros: { campo: mensagem } }.
async function salvarCliente(dados, id) {
  const cliente = {
    nome: (dados.nome || "").trim(),
    empresa: (dados.empresa || "").trim(),
    cpf: somenteDigitos(dados.cpf),
    dataNascimento: dados.dataNascimento || "",
    whatsapp: normalizarTelefone(dados.whatsapp),
    email: (dados.email || "").trim(),
    endereco: (dados.endereco || "").trim(),
    cidade: (dados.cidade || "").trim(),
    estado: dados.estado || "",
  };

  const erros = {};
  if (!cliente.nome) erros.nome = "Informe o nome.";
  if (cliente.cpf && !cpfValido(cliente.cpf)) {
    erros.cpf = "CPF inválido.";
  } else if (cliente.cpf) {
    const outros = await listarClientes();
    if (outros.some((c) => c.id !== id && c.cpf === cliente.cpf)) erros.cpf = "Já existe um cliente com este CPF.";
  }
  if (cliente.whatsapp && ![10, 11].includes(cliente.whatsapp.length)) {
    erros.whatsapp = "Informe o DDD e o número, por exemplo (11) 91234-5678.";
  }
  if (cliente.email && !emailValido(cliente.email)) erros.email = "Informe um e-mail válido.";
  if (cliente.dataNascimento && cliente.dataNascimento > hojeISO()) {
    erros.dataNascimento = "A data de aniversário não pode estar no futuro.";
  }
  if (Object.keys(erros).length) return { erros };

  const novoId = await Banco.salvar(CLIENTES, cliente, id);
  return { id: novoId, cliente: Object.assign({ id: novoId }, cliente) };
}

// Cliente com vendas registradas não pode ser excluído (para não perder o histórico).
async function excluirCliente(id) {
  const vendas = await listarVendas();
  if (vendas.some((v) => v.clienteId === id)) {
    return { erro: "Este cliente tem vendas registradas e não pode ser excluído. Exclua as vendas antes, se for mesmo necessário." };
  }
  await Banco.excluir(CLIENTES, id);
  return {};
}
