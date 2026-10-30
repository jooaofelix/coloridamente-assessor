// Início: resumo do mês, aniversariantes do mês e últimas vendas.

(async function () {
  const agora = new Date();
  const hora = agora.getHours();
  document.getElementById("saudacao").textContent = hora < 12 ? "Bom dia!" : hora < 18 ? "Boa tarde!" : "Boa noite!";
  const dataPorExtenso = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(agora);
  document.getElementById("hoje").textContent = dataPorExtenso.charAt(0).toUpperCase() + dataPorExtenso.slice(1);
  document.querySelectorAll("[data-mes]").forEach((e) => { e.textContent = nomeDoMes(agora); });

  let clientes;
  let vendas;
  try {
    [clientes, vendas] = await Promise.all([listarClientes(), listarVendas()]);
  } catch (erro) {
    mostrarErroDeCarregamento(erro);
    return;
  }

  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);
  const vendasDoMes = vendas.filter((v) => (v.data || "").slice(0, 7) === mesAtual && v.data <= hoje);
  document.getElementById("total-clientes").textContent = clientes.length;
  document.getElementById("vendas-do-mes").textContent = vendasDoMes.length;
  document.getElementById("faturamento-do-mes").textContent =
    formatarBRL(vendasDoMes.reduce((soma, v) => soma + (v.total || 0), 0));

  const nomes = new Map(clientes.map((c) => [c.id, c.nome]));
  const diaDeHoje = Number(hoje.slice(8, 10));
  const aniversariantes = clientes
    .filter((c) => c.dataNascimento && c.dataNascimento.slice(5, 7) === hoje.slice(5, 7))
    .sort((a, b) => a.dataNascimento.slice(8).localeCompare(b.dataNascimento.slice(8)) || a.nome.localeCompare(b.nome, "pt-BR"));

  document.getElementById("aniversariantes").innerHTML = aniversariantes.length
    ? `<ul class="list-unstyled lista-aniversariantes mb-0">${aniversariantes.map((c) => {
        const dia = Number(c.dataNascimento.slice(8, 10));
        const classe = dia === diaDeHoje ? "hoje" : dia < diaDeHoje ? "passou" : "";
        return `<li class="${classe}">
          <span class="dia">${formatarDiaMes(c.dataNascimento)}</span>
          <a href="cliente.html?id=${encodeURIComponent(c.id)}">${esc(c.nome)}</a>
          ${dia === diaDeHoje ? '<span class="badge selo selo-hoje ms-auto">Hoje!</span>' : ""}
        </li>`;
      }).join("")}</ul>`
    : `<div class="vazio vazio-compacto"><i class="bi bi-cake2" aria-hidden="true"></i><p>Nenhum aniversariante neste mês.</p></div>`;

  const ultimas = vendas.slice(0, 5);
  document.getElementById("ultimas-vendas").innerHTML = ultimas.length
    ? `<ul class="list-unstyled lista-vendas mb-0">${ultimas.map((v) => `
        <li>
          <a class="stretched-link-wrapper" href="venda.html?id=${encodeURIComponent(v.id)}">
            <span class="fw-semibold">${esc(nomes.get(v.clienteId) || v.clienteNome)}</span>
            <span class="text-body-secondary small d-block text-truncate">${formatarDiaMes(v.data)} · ${esc(resumoDosItens(v))}</span>
          </a>
          <span class="fw-semibold text-nowrap">${formatarBRL(v.total)}</span>
        </li>`).join("")}</ul>`
    : `<div class="vazio vazio-compacto"><i class="bi bi-bag" aria-hidden="true"></i><p>Nenhuma venda registrada ainda.</p></div>`;
})();
