// Funções compartilhadas por todas as telas: formatação, validação e avisos.

function esc(valor) {
  return String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

// Para buscas: ignora maiúsculas e acentos ("João" encontra "joao").
function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function firebaseConfigurado() {
  return typeof firebaseConfig === "object" && Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

function parametro(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

// ---- Dinheiro

const FORMATO_BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarBRL(valor) {
  return FORMATO_BRL.format(Number(valor) || 0);
}

// Aceita "47,50", "47.50" ou "1.234,56". Vazio vira null.
function paraNumero(texto) {
  let t = String(texto == null ? "" : texto).trim().replace(/\s|R\$/g, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function arredondar(valor) {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

// ---- CPF, telefone e e-mail

function cpfValido(cpf) {
  const d = somenteDigitos(cpf);
  // CPFs com todos os dígitos iguais passam no cálculo, mas são inválidos.
  if (d.length !== 11 || d === d[0].repeat(11)) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(d[tamanho])) return false;
  }
  return true;
}

function formatarCpf(cpf) {
  const d = somenteDigitos(cpf);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf || "";
}

// Guarda só DDD + número (tira o 55 do Brasil, se vier).
function normalizarTelefone(telefone) {
  let d = somenteDigitos(telefone);
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  return d;
}

function formatarTelefone(telefone) {
  const d = normalizarTelefone(telefone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone || "";
}

function linkWhatsapp(telefone) {
  const d = normalizarTelefone(telefone);
  return d ? `https://wa.me/55${d}` : "";
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- Datas (sempre "AAAA-MM-DD", no fuso do computador)

function hojeISO() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

function formatarData(iso) {
  if (!iso) return "";
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

function formatarDiaMes(iso) {
  return iso ? formatarData(iso).slice(0, 5) : "";
}

function idade(dataNascimento) {
  if (!dataNascimento) return null;
  const [a, m, d] = dataNascimento.split("-").map(Number);
  const hoje = new Date();
  const aindaNaoFez = hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d);
  return hoje.getFullYear() - a - (aindaNaoFez ? 1 : 0);
}

function nomeDoMes(data) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(data || new Date());
}

// ---- Avisos (mensagem que aparece na próxima tela, ex.: "Cliente cadastrado.")

function avisarNaProximaTela(mensagem, tipo) {
  try {
    sessionStorage.setItem("assessor-aviso", JSON.stringify({ mensagem, tipo: tipo || "success" }));
  } catch (e) {
    // sem sessionStorage o aviso só não aparece
  }
}

function mostrarAviso(mensagem, tipo) {
  const area = document.getElementById("avisos");
  if (!area) return;
  area.insertAdjacentHTML(
    "beforeend",
    `<div class="alert alert-${tipo || "success"} alert-dismissible fade show mt-3 mb-0" role="alert">
      ${esc(mensagem)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>`
  );
}

function mostrarErroDeCarregamento(erro) {
  console.error(erro);
  mostrarAviso("Não foi possível falar com o banco de dados. Verifique a internet e recarregue a página.", "danger");
}

// ---- Erros de formulário

function limparErros(formulario) {
  formulario.querySelectorAll(".is-invalid").forEach((c) => c.classList.remove("is-invalid"));
  formulario.querySelectorAll("[data-erro]").forEach((e) => e.remove());
}

function marcarErro(campo, mensagem) {
  campo.classList.add("is-invalid");
  const aviso = document.createElement("div");
  aviso.className = "invalid-feedback";
  aviso.dataset.erro = "";
  aviso.textContent = mensagem;
  const grupo = campo.closest(".input-group");
  if (grupo) aviso.classList.add("d-block");
  (grupo || campo).insertAdjacentElement("afterend", aviso);
}

// erros: { nomeDoCampo: "mensagem" }. O campo é achado pelo atributo name.
function mostrarErros(formulario, erros) {
  let primeiro = null;
  Object.keys(erros).forEach((nome) => {
    const campo = formulario.querySelector(`[name="${nome}"]`);
    if (!campo) return;
    marcarErro(campo, erros[nome]);
    primeiro = primeiro || campo;
  });
  if (primeiro) primeiro.focus();
  return primeiro;
}

function dadosDoFormulario(formulario) {
  const dados = {};
  new FormData(formulario).forEach((valor, nome) => {
    dados[nome] = typeof valor === "string" ? valor.trim() : valor;
  });
  formulario.querySelectorAll('input[type="checkbox"][name]').forEach((c) => {
    dados[c.name] = c.checked;
  });
  return dados;
}

// ---- Máscaras de CPF e WhatsApp (data-mascara="cpf" | "telefone")

function aplicarMascaras(raiz) {
  (raiz || document).querySelectorAll("[data-mascara]").forEach((campo) => {
    if (campo.dataset.mascaraAtiva) return;
    campo.dataset.mascaraAtiva = "1";
    campo.addEventListener("input", () => {
      const d = campo.value.replace(/\D/g, "").slice(0, 11);
      if (campo.dataset.mascara === "cpf") {
        const partes = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join(".");
        campo.value = d.length > 9 ? `${partes}-${d.slice(9)}` : partes;
      } else if (d.length <= 2) {
        campo.value = d ? `(${d}` : "";
      } else {
        const meio = d.length === 11 ? 7 : 6;
        campo.value = `(${d.slice(0, 2)}) ${d.slice(2, meio)}${d.length > meio ? "-" + d.slice(meio) : ""}`;
      }
    });
  });
}
