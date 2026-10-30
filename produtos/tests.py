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
        produto = Produto.objects.get()
        self.assertTrue(produto.ativo)
        self.assertEqual(
            resposta.json(), {"ok": True, "id": produto.pk, "nome": "Quadro", "preco": "120.50"}
        )

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
        self.assertFalse(Produto.objects.exists())
