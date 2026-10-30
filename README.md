# Assessor Coloridamente

O núcleo de gestão da Coloridamente: um só lugar para registrar vendas (atendimentos),
clientes e produtos. Cada frente fica numa aba, e novas abas podem entrar com o tempo.

Funciona como o sistema da AEA (`contrato-contabilidade`): **site estático** (HTML, CSS e
JavaScript) publicado na **Cloudflare**, com os dados no **Firebase Firestore** e **sem login**.

## Abas

| Aba | O que faz |
| --- | --- |
| **Início** | Resumo do mês (clientes, vendas e faturamento), aniversariantes do mês e últimas vendas. |
| **Vendas** | Cada atendimento: cliente, data, ocasião, forma de pagamento, observações e **os produtos vendidos** (quantidade e valor). O total é calculado na hora. Dá para **cadastrar um cliente ou um produto sem sair da venda**. |
| **Clientes** | Nome, empresa, CPF, data de aniversário (a idade é calculada sozinha), WhatsApp, e-mail, endereço e cidade/estado. A ficha mostra o histórico de compras e abre a conversa no WhatsApp. |
| **Produtos** | Catálogo com categoria, preço e descrição. Já vem com os 4 itens da **Linha Office**, iguais aos do site. |

Regras importantes:

- **Preço sob orçamento:** o preço do produto é opcional, porque na Coloridamente o valor sai do orçamento. Na venda, o valor de um produto sem preço precisa ser informado; com preço, ele já vem preenchido (e pode ser alterado).
- **CPF:** é opcional, mas quando informado é validado e não pode se repetir.
- **Exclusão protegida:** cliente ou produto que já aparece em vendas não pode ser excluído, para não perder o histórico. Para tirar um produto da lista de venda, desmarque **Disponível para venda**.

## Modo de teste

Enquanto o `public/js/firebase-config.js` estiver vazio, o assessor roda em **modo de teste**:
os dados ficam só no navegador em que foram digitados, e uma faixa amarela avisa isso no topo de
todas as telas. Serve para experimentar o sistema antes de configurar o Firebase.

## 1. Configurar o Firebase (uma vez)

Use um projeto **só da Coloridamente**, separado do projeto da AEA.

1. Em <https://console.firebase.google.com>, clique em **Adicionar projeto** (por exemplo, `coloridamente-assessor`).
2. No menu **Firestore Database**, clique em **Criar banco de dados**. Escolha a região
   **southamerica-east1 (São Paulo)** e o **modo de produção**.
3. Na aba **Regras** do Firestore, apague o que estiver lá, cole o conteúdo do arquivo
   [`firestore.rules`](firestore.rules) e clique em **Publicar**.
4. Em **Configurações do projeto** (engrenagem) > **Seus apps**, clique no ícone **Web** (`</>`),
   dê um apelido (por exemplo, `assessor`) e registre o app. Não precisa do Firebase Hosting.
5. Copie os valores do `firebaseConfig` que aparecem na tela para
   [`public/js/firebase-config.js`](public/js/firebase-config.js) e envie para o GitHub.

Na próxima publicação, a faixa de modo de teste some e os dados passam a ficar na nuvem,
os mesmos em qualquer computador ou celular.

Os produtos da Linha Office são cadastrados sozinhos na primeira vez que o assessor abre.

## 2. Publicar na Cloudflare

O projeto já tem o [`wrangler.jsonc`](wrangler.jsonc), que publica a pasta `public/` como site
estático. No Worker conectado a este repositório (Workers Builds), o comando de deploy é o padrão:

```bash
npx wrangler deploy
```

Cada envio para a branch configurada no Worker publica sozinho.

## 3. Proteger o acesso (recomendado)

O assessor não tem login, e guarda CPF, endereço e aniversário dos clientes. Para que só a
equipe abra o endereço, use o **Cloudflare Access** (grátis para até 50 pessoas):

1. No painel da Cloudflare, vá em **Workers & Pages** e abra o Worker do assessor.
2. Em **Settings** > **Domains & Routes** (ou na aba **Domains**), clique em
   **Enable Cloudflare Access** no endereço `workers.dev`.
3. Em **Manage Cloudflare Access**, deixe só os e-mails da equipe.

Assim, antes de abrir o assessor, a Cloudflare pede o e-mail e envia um código de acesso.

Importante: o Access protege as telas. As regras do Firestore liberam as coleções do assessor
para quem tiver os dados do `firebase-config.js`, então não compartilhe esse arquivo nem o
endereço fora da equipe.

## Rodar no computador

Pré-requisito: Node.js 18 ou mais novo.

```bash
npm run dev
```

Abra <http://localhost:8788>. Sem o Firebase configurado, roda em modo de teste.

## Testes

Testes de navegador com Playwright (rodam em modo de teste, sem Firebase):

```bash
npm install
npx playwright install chromium
npm test
```

## Estrutura

```
public/                      tudo o que é publicado
  index.html                 Início
  vendas.html                lista de vendas
  venda.html                 detalhe da venda (?id=)
  venda-form.html            nova venda / editar (?id=), já com cliente (?cliente=)
  clientes.html              lista de clientes
  cliente.html               ficha do cliente (?id=)
  cliente-form.html          novo cliente / editar (?id=)
  produtos.html              catálogo de produtos
  produto-form.html          novo produto / editar (?id=)
  404.html                   página de endereço não encontrado
  css/assessor.css           identidade visual (a mesma do site da Linha Office)
  js/firebase-config.js      dados do projeto no Firebase
  js/banco.js                acesso ao Firestore (ou ao navegador, no modo de teste)
  js/*-store.js              regras de clientes, produtos e vendas
  js/app-*.js                o que cada tela faz
  js/util.js, layout.js      utilidades e cabeçalho com as abas
  js/formularios.js          campos de cliente e produto (página e cadastro rápido)
  vendor/                    Bootstrap, ícones e fonte Lato (servidos localmente)
firestore.rules              regras de segurança do Firestore
wrangler.jsonc               configuração da Cloudflare
tests/                       testes de navegador e servidor local
```

## Dados no Firestore

| Coleção | Um documento por… | Campos principais |
| --- | --- | --- |
| `clientes` | cliente | `nome`, `empresa`, `cpf`, `dataNascimento`, `whatsapp`, `email`, `endereco`, `cidade`, `estado` |
| `produtos` | produto | `nome`, `categoria`, `preco` (ou vazio = sob orçamento), `descricao`, `ativo` |
| `vendas` | venda | `clienteId`, `clienteNome`, `data`, `ocasiao`, `formaPagamento`, `observacoes`, `itens` (produto, quantidade, valor), `total` |
| `configuracoes` | ajuste interno | `catalogo.linhaOfficeCadastrada` |

Cada venda guarda os produtos vendidos dentro dela, então é gravada inteira de uma vez.
