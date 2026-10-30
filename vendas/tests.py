from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from clientes.models import Cliente
from produtos.models import Produto

from .models import ItemVenda, Venda


def dados_venda(cliente, itens, **extra):
    """Monta o POST do formulário de venda (venda + produtos vendidos)."""
    dados = {
        "cliente": cliente.pk,
        "data": "2026-10-30",
        "forma_pagamento": "pix",
        "observacoes": "",
        "itens-TOTAL_FORMS": len(itens),
        "itens-INITIAL_FORMS": 0,
        "itens-MIN_NUM_FORMS": 1,
        "itens-MAX_NUM_FORMS": 1000,
    }
    for i, item in enumerate(itens):
        for campo, valor in item.items():
            dados[f"itens-{i}-{campo}"] = valor
    dados.update(extra)
    return dados


class VendaTests(TestCase):
    def setUp(self):
        self.client.force_login(User.objects.create_user("loja", password="senha-forte-123"))
        self.cliente = Cliente.objects.create(nome="Ana")
        self.caneca = Produto.objects.create(nome="Caneca", preco=Decimal("35.00"))
        self.quadro = Produto.objects.create(nome="Quadro", preco=Decimal("120.00"))

    def test_registrar_venda_com_varios_produtos(self):
        resposta = self.client.post(
            reverse("vendas:nova"),
            dados_venda(
                self.cliente,
                [
                    {"produto": self.caneca.pk, "quantidade": 2, "valor_unitario": "30.00"},
                    {"produto": self.quadro.pk, "quantidade": 1, "valor_unitario": ""},
                ],
            ),
        )
        venda = Venda.objects.get()
        self.assertRedirects(resposta, venda.get_absolute_url())
        self.assertEqual(venda.itens.count(), 2)
        # Valor em branco usa o preço cadastrado do produto.
        self.assertEqual(venda.itens.get(produto=self.quadro).valor_unitario, Decimal("120.00"))
        self.assertEqual(venda.total, Decimal("180.00"))

    def test_produto_sob_orcamento_exige_valor(self):
        agenda = Produto.objects.get(nome="Agenda 2027")
        dados = dados_venda(self.cliente, [{"produto": agenda.pk, "quantidade": 50, "valor_unitario": ""}])
        resposta = self.client.post(reverse("vendas:nova"), dados)
        self.assertContains(resposta, "Informe o valor: este produto é sob orçamento.")
        self.assertFalse(Venda.objects.exists())

        dados["itens-0-valor_unitario"] = "42.00"
        dados["ocasiao"] = "boas-vindas"
        self.client.post(reverse("vendas:nova"), dados)
        venda = Venda.objects.get()
        self.assertEqual(venda.total, Decimal("2100.00"))
        self.assertEqual(venda.get_ocasiao_display(), "Boas-vindas à equipe")

    def test_venda_sem_produto_e_recusada(self):
        resposta = self.client.post(
            reverse("vendas:nova"),
            dados_venda(self.cliente, [{"produto": "", "quantidade": 1, "valor_unitario": ""}]),
        )
        self.assertEqual(resposta.status_code, 200)
        self.assertFalse(Venda.objects.exists())

    def test_editar_venda_removendo_produto(self):
        venda = Venda.objects.create(cliente=self.cliente)
        item_caneca = ItemVenda.objects.create(
            venda=venda, produto=self.caneca, quantidade=1, valor_unitario=Decimal("35")
        )
        item_quadro = ItemVenda.objects.create(
            venda=venda, produto=self.quadro, quantidade=1, valor_unitario=Decimal("120")
        )
        dados = dados_venda(
            self.cliente,
            [
                {"id": item_caneca.pk, "produto": self.caneca.pk, "quantidade": 3, "valor_unitario": "35"},
                {"id": item_quadro.pk, "produto": self.quadro.pk, "quantidade": 1,
                 "valor_unitario": "120", "DELETE": "on"},
            ],
            **{"itens-INITIAL_FORMS": 2},
        )
        resposta = self.client.post(reverse("vendas:editar", args=[venda.pk]), dados)
        self.assertRedirects(resposta, venda.get_absolute_url())
        self.assertEqual(list(venda.itens.values_list("produto__nome", "quantidade")), [("Caneca", 3)])

    def test_produto_fora_de_venda_nao_aparece_mas_venda_antiga_mantem(self):
        venda = Venda.objects.create(cliente=self.cliente)
        ItemVenda.objects.create(venda=venda, produto=self.quadro, valor_unitario=Decimal("120"))
        self.quadro.ativo = False
        self.quadro.save()

        nova = self.client.get(reverse("vendas:nova"))
        self.assertNotContains(nova, ">Quadro<")
        edicao = self.client.get(reverse("vendas:editar", args=[venda.pk]))
        self.assertContains(edicao, ">Quadro<")

    def test_cliente_com_vendas_nao_pode_ser_excluido(self):
        Venda.objects.create(cliente=self.cliente)
        self.client.post(reverse("clientes:excluir", args=[self.cliente.pk]))
        self.assertTrue(Cliente.objects.filter(pk=self.cliente.pk).exists())

    def test_busca_por_produto(self):
        venda = Venda.objects.create(cliente=self.cliente)
        ItemVenda.objects.create(venda=venda, produto=self.caneca, valor_unitario=Decimal("35"))
        self.assertContains(self.client.get(reverse("vendas:lista"), {"q": "canec"}), "Ana")
        self.assertNotContains(self.client.get(reverse("vendas:lista"), {"q": "quadro"}), "Ana")


class InicioTests(TestCase):
    def test_resumo_do_mes(self):
        self.client.force_login(User.objects.create_user("loja", password="senha-forte-123"))
        cliente = Cliente.objects.create(nome="Ana")
        produto = Produto.objects.create(nome="Caneca", preco=Decimal("35"))
        venda = Venda.objects.create(cliente=cliente)
        ItemVenda.objects.create(venda=venda, produto=produto, quantidade=2, valor_unitario=Decimal("35"))

        resposta = self.client.get(reverse("core:inicio"))
        self.assertEqual(resposta.context["qtd_vendas_do_mes"], 1)
        self.assertEqual(resposta.context["faturamento_do_mes"], Decimal("70"))
        self.assertContains(resposta, "R$ 70,00")
