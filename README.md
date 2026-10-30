# Assessor Coloridamente

O núcleo de gestão da Coloridamente: um só lugar para registrar clientes, produtos e
vendas (atendimentos). Cada frente fica numa aba, e novas abas podem entrar com o tempo.

## Abas

| Aba | O que faz |
| --- | --- |
| **Início** | Resumo do mês (clientes, vendas, faturamento), aniversariantes do mês e últimas vendas. |
| **Vendas** | Registra cada atendimento: cliente, data, forma de pagamento, observações e **os produtos vendidos** (quantidade e valor). O total é calculado na hora. Dá para **cadastrar um cliente ou um produto novo sem sair da venda**. |
| **Clientes** | Cadastro com nome, CPF, data de aniversário (a idade é calculada sozinha), e-mail, endereço e cidade/estado. A ficha do cliente mostra o histórico de compras. |
| **Produtos** | Catálogo com nome, preço e descrição. Ao escolher o produto na venda, o preço já vem preenchido (e pode ser alterado). |

Regras importantes:

- O CPF é opcional, mas quando informado é validado e não pode se repetir.
- Cliente ou produto que já aparece em vendas não pode ser excluído, para não perder o histórico.
  Para tirar um produto da lista de venda, desmarque **Disponível para venda**.
- Todo o sistema exige login.

## Como rodar no computador

Pré-requisito: Python 3.10 ou mais novo.

```bash
python -m venv .venv
source .venv/bin/activate      # no Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # cria o seu usuário de acesso
python manage.py runserver
```

Depois abra <http://127.0.0.1:8000> e entre com o usuário criado.

Novos usuários (funcionários) podem ser criados em <http://127.0.0.1:8000/admin/>.

## Testes

```bash
python manage.py test
```

## Estrutura

```
assessor/    configurações do projeto (settings, urls)
core/        página Início, layout e utilidades compartilhadas
clientes/    aba Clientes
produtos/    aba Produtos
vendas/      aba Vendas (venda + produtos vendidos)
templates/   telas (HTML)
static/      CSS, JavaScript e Bootstrap (servido localmente)
```

## Antes de colocar no ar

Em produção, defina as variáveis de ambiente:

- `DJANGO_SECRET_KEY`: uma chave secreta longa e aleatória
- `DJANGO_DEBUG=0`
- `DJANGO_ALLOWED_HOSTS`: o domínio do site (ex.: `assessor.coloridamente.com.br`)

E rode `python manage.py collectstatic`. Como o sistema guarda CPF e dados pessoais,
use HTTPS e faça backup do banco de dados.
