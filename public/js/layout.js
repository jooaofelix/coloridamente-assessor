// Cabeçalho com a logo e as abas, aviso de "modo de teste" e área de avisos.
// Carregado logo depois do <header id="cabecalho" data-aba="...">, para o
// cabeçalho aparecer junto com o resto da página.

(function () {
  const cabecalho = document.getElementById("cabecalho");
  const abaAtual = cabecalho.dataset.aba;
  const abas = [
    ["inicio", "index.html", "bi-grid-1x2", "Início"],
    ["vendas", "vendas.html", "bi-bag-heart", "Vendas"],
    ["clientes", "clientes.html", "bi-people", "Clientes"],
    ["produtos", "produtos.html", "bi-box-seam", "Produtos"],
  ];

  cabecalho.innerHTML = `
    <div class="faixa-colorida" aria-hidden="true"></div>
    <nav class="navbar navbar-expand-md cabecalho" aria-label="Principal">
      <div class="container">
        <a class="navbar-brand marca" href="index.html">
          <img src="assets/logo-coloridamente.svg" alt="Coloridamente" width="99" height="40">
          <span class="marca-assessor">Assessor</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu"
                aria-controls="menu" aria-expanded="false" aria-label="Abrir menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menu">
          <ul class="navbar-nav abas ms-md-3">
            ${abas.map(([aba, href, icone, nome]) => `
              <li class="nav-item">
                <a class="nav-link ${aba === abaAtual ? "active" : ""}" href="${href}" ${aba === abaAtual ? 'aria-current="page"' : ""}>
                  <i class="bi ${icone}" aria-hidden="true"></i> ${nome}
                </a>
              </li>`).join("")}
          </ul>
        </div>
      </div>
    </nav>`;

  const modoDeTeste = firebaseConfigurado() ? "" : `
    <div class="alert alert-warning modo-teste mt-3 mb-0" role="note">
      <strong>Modo de teste:</strong> os dados ficam só neste navegador.
      Para salvar na nuvem e usar em qualquer computador ou celular, preencha o
      <code>firebase-config.js</code> (o passo a passo está no README).
    </div>`;
  cabecalho.insertAdjacentHTML("afterend", `<div class="container" id="avisos">${modoDeTeste}</div>`);

  try {
    const aviso = JSON.parse(sessionStorage.getItem("assessor-aviso"));
    if (aviso) {
      sessionStorage.removeItem("assessor-aviso");
      mostrarAviso(aviso.mensagem, aviso.tipo);
    }
  } catch (e) {
    // sem sessionStorage não há aviso para mostrar
  }
})();
