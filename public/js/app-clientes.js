// Lista de clientes, com busca por nome, empresa, CPF, WhatsApp, e-mail ou cidade.

(async function () {
  const lista = document.getElementById("lista");
  const busca = document.getElementById("busca");
  let clientes;
  let vendas;
  try {
    [clientes, vendas] = await Promise.all([listarClientes(), listarVendas()]);
  } catch (erro) {
    lista.innerHTML = "";
    mostrarErroDeCarregamento(erro);
    return;
  }
  const compras = new Map();
  vendas.forEach((v) => compras.set(v.clienteId, (compras.get(v.clienteId) || 0) + 1));

  function combina(cliente, termo) {
    const textos = [cliente.nome, cliente.empresa, cliente.email, cliente.cidade].map(normalizar);
    if (textos.some((t) => t.includes(termo))) return true;
    const digitos = somenteDigitos(termo);
    return Boolean(digitos) && [cliente.cpf, cliente.whatsapp].some((d) => (d || "").includes(digitos));
  }

  function desenhar() {
    const termo = normalizar(busca.value.trim());
    const filtrados = termo ? clientes.filter((c) => combina(c, termo)) : clientes;
    const n = filtrados.length;
    document.getElementById("contagem").textContent =
      `${n} cliente${n === 1 ? "" : "s"}${termo ? ` encontrado${n === 1 ? "" : "s"}` : ""}`;

    if (!n) {
      lista.innerHTML = termo
        ? `<div class="vazio"><i class="bi bi-people" aria-hidden="true"></i><p>Nenhum cliente encontrado para “${esc(busca.value.trim())}”.</p></div>`
        : `<div class="vazio"><i class="bi bi-people" aria-hidden="true"></i><p>Nenhum cliente cadastrado ainda.</p>
            <a class="btn btn-primary" href="cliente-form.html">Cadastrar o primeiro cliente</a></div>`;
      return;
    }

    lista.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Nome</th><th>WhatsApp</th><th>CPF</th><th class="text-center">Idade</th>
              <th>Aniversário</th><th>Cidade/Estado</th><th>E-mail</th><th class="text-center">Compras</th>
            </tr>
          </thead>
          <tbody>
            ${filtrados.map((c) => `<tr>
              <td>
                <a class="fw-bold" href="cliente.html?id=${encodeURIComponent(c.id)}">${esc(c.nome)}</a>
                ${c.empresa ? `<span class="d-block small text-body-secondary">${esc(c.empresa)}</span>` : ""}
              </td>
              <td class="text-nowrap">${esc(formatarTelefone(c.whatsapp)) || "—"}</td>
              <td class="text-nowrap">${esc(formatarCpf(c.cpf)) || "—"}</td>
              <td class="text-center">${c.dataNascimento ? idade(c.dataNascimento) : "—"}</td>
              <td class="text-nowrap">${formatarDiaMes(c.dataNascimento) || "—"}</td>
              <td>${esc(cidadeEstado(c)) || "—"}</td>
              <td>${esc(c.email) || "—"}</td>
              <td class="text-center"><span class="badge contador">${compras.get(c.id) || 0}</span></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }

  busca.addEventListener("input", desenhar);
  desenhar();
})();
