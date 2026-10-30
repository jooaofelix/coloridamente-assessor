from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from clientes.models import Cliente
from vendas.models import ItemVenda, Venda

from .forms import ProdutoForm
from .models import Produto


class ProdutoTests(TestCase):
    def setUp(self):
        self.client.force_login(User.objects.create_user("loja", password="senha-forte-123"))

    def test_nome_repetido_e_recusado_sem_diferenciar_maiusculas(self):
        Produto.objects.create(nome="Caneca", preco=Decimal("30"))
        form = ProdutoForm(data={"nome": "  caneca ", "preco": "10", "ativo": True})
        self.assertFalse(form.is_valid())
        self.assertIn("nome", form.errors)

    def test_cadastro_rapido_ja_nasce_disponivel(self):
        resposta = self.client.post(
            reverse("produtos:novo_rapido"),
            {"novo_produto-nome": "Quadro", "novo_produto-preco": "120.50"},
        )
        produto = Produto.objects.get(nome="Quadro")
        self.assertTrue(produto.ativo)
        self.assertEqual(
            resposta.json(), {"ok": True, "id": produto.pk, "nome": "Quadro", "preco": "120.50"}
        )

    def test_cadastro_rapido_sob_orcamento(self):
        resposta = self.client.post(
            reverse("produtos:novo_rapido"),
            {"novo_produto-nome": "Bloco de mesa", "novo_produto-categoria": "papelaria-corporativa"},
        )
        produto = Produto.objects.get(nome="Bloco de mesa")
        self.assertIsNone(produto.preco)
        self.assertIsNone(resposta.json()["preco"])

    def test_produto_vendido_nao_pode_ser_excluido(self):
        produto = Produto.objects.create(nome="Caneca", preco=Decimal("30"))
        venda = Venda.objects.create(cliente=Cliente.objects.create(nome="Ana"))
        ItemVenda.objects.create(venda=venda, produto=produto, valor_unitario=Decimal("30"))

        self.client.post(reverse("produtos:excluir", args=[produto.pk]))
        self.assertTrue(Produto.objects.filter(pk=produto.pk).exists())

    def test_excluir_produto_sem_vendas(self):
        produto = Produto.objects.create(nome="Caneca", preco=Decimal("30"))
        resposta = self.client.post(reverse("produtos:excluir", args=[produto.pk]))
        self.assertRedirects(resposta, reverse("produtos:lista"))
        self.assertFalse(Produto.objects.filter(pk=produto.pk).exists())

    def test_catalogo_ja_vem_com_a_linha_office(self):
        linha_office = Produto.objects.filter(
            nome__in=[
                "Agenda 2027",
                "Kit de acessórios para escritório",
                "Caderno com capa personalizada",
                "Caderno pautado personalizado",
            ]
        )
        self.assertEqual(linha_office.count(), 4)
        # Sem preço inventado: o valor sai do orçamento.
        self.assertFalse(linha_office.filter(preco__isnull=False).exists())

    def test_lista_mostra_sob_orcamento_e_filtra_categoria(self):
        resposta = self.client.get(reverse("produtos:lista"), {"categoria": "acessorios-para-escritorio"})
        self.assertContains(resposta, "Kit de acessórios para escritório")
        self.assertContains(resposta, "Sob orçamento")
        self.assertNotContains(resposta, "Agenda 2027")
