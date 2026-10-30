// Camada de acesso aos dados. Com o firebase-config.js preenchido, grava no
// Firestore (como o sistema da AEA). Sem ele, roda em "modo de teste" e guarda
// tudo no localStorage deste navegador, para dar para experimentar o assessor
// antes de configurar o Firebase.

const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.14.1/";

const Banco = (function () {
  let firestore = null;

  function carregarScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  const pronto = (async function () {
    if (!firebaseConfigurado()) return;
    await carregarScript(FIREBASE_SDK + "firebase-app-compat.js");
    await carregarScript(FIREBASE_SDK + "firebase-firestore-compat.js");
    firebase.initializeApp(firebaseConfig);
    firestore = firebase.firestore();
  })();

  // ---- Modo de teste (localStorage)

  const PREFIXO = "assessor-coloridamente:";

  function lerLocal(colecao) {
    try {
      return JSON.parse(localStorage.getItem(PREFIXO + colecao)) || {};
    } catch (e) {
      return {};
    }
  }

  function gravarLocal(colecao, docs) {
    try {
      localStorage.setItem(PREFIXO + colecao, JSON.stringify(docs));
    } catch (e) {
      throw new Error("Este navegador não deixou salvar os dados (modo anônimo?).");
    }
  }

  function novoIdLocal() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // O Firestore recusa o registro inteiro se algum campo for undefined.
  function semUndefined(obj) {
    const limpo = {};
    Object.keys(obj).forEach((k) => {
      if (k !== "id") limpo[k] = obj[k] === undefined ? null : obj[k];
    });
    return limpo;
  }

  // ---- Operações

  async function listar(colecao) {
    await pronto;
    if (firestore) {
      const snap = await firestore.collection(colecao).get();
      return snap.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
    }
    const docs = lerLocal(colecao);
    return Object.keys(docs).map((id) => Object.assign({ id }, docs[id]));
  }

  async function obter(colecao, id) {
    if (!id) return null;
    await pronto;
    if (firestore) {
      const doc = await firestore.collection(colecao).doc(id).get();
      return doc.exists ? Object.assign({ id: doc.id }, doc.data()) : null;
    }
    const docs = lerLocal(colecao);
    return docs[id] ? Object.assign({ id }, docs[id]) : null;
  }

  // Cria (sem id, ou com um id novo) ou substitui o registro. Mantém a data
  // de criação original e devolve o id.
  async function salvar(colecao, dados, id) {
    await pronto;
    const existente = id ? await obter(colecao, id) : null;
    const agora = new Date().toISOString();
    const registro = Object.assign(semUndefined(dados), {
      criadoEm: (existente && existente.criadoEm) || agora,
      atualizadoEm: agora,
    });
    if (firestore) {
      const ref = id ? firestore.collection(colecao).doc(id) : firestore.collection(colecao).doc();
      await ref.set(registro);
      return ref.id;
    }
    const docs = lerLocal(colecao);
    const novoId = id || novoIdLocal();
    docs[novoId] = registro;
    gravarLocal(colecao, docs);
    return novoId;
  }

  async function excluir(colecao, id) {
    await pronto;
    if (firestore) {
      await firestore.collection(colecao).doc(id).delete();
      return;
    }
    const docs = lerLocal(colecao);
    delete docs[id];
    gravarLocal(colecao, docs);
  }

  return {
    pronto,
    listar,
    obter,
    salvar,
    excluir,
    modoDeTeste: !firebaseConfigurado(),
  };
})();
