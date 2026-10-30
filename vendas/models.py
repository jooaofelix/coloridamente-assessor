from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.urls import reverse
from django.utils import timezone

from clientes.models import Cliente
from produtos.models import Produto


class Venda(models.Model):
    class FormaPagamento(models.TextChoices):
        PIX = "pix", "Pix"
        DINHEIRO = "dinheiro", "Dinheiro"
        CREDITO = "credito", "Cartão de crédito"
        DEBITO = "debito", "Cartão de débito"
        OUTRO = "outro", "Outro"

    # PROTECT: um cliente com vendas registradas não pode ser excluído.
    cliente = models.ForeignKey(
        Cliente, verbose_name="cliente", on_delete=models.PROTECT, related_name="vendas"
    )
    data = models.DateField("data", default=timezone.localdate)
    forma_pagamento = models.CharField(
        "forma de pagamento", max_length=20, choices=FormaPagamento.choices, blank=True
    )
    observacoes = models.TextField("observações do atendimento", blank=True)
    criado_em = models.DateTimeField("registrada em", auto_now_add=True)
    atualizado_em = models.DateTimeField("atualizada em", auto_now=True)

    class Meta:
        ordering = ["-data", "-criado_em"]
        verbose_name = "venda"
        verbose_name_plural = "vendas"

    def __str__(self):
        return f"Venda #{self.pk} – {self.cliente}"

    def get_absolute_url(self):
        return reverse("vendas:detalhe", args=[self.pk])

    @property
    def total(self):
        return sum((item.subtotal for item in self.itens.all()), Decimal("0"))


class ItemVenda(models.Model):
    venda = models.ForeignKey(Venda, on_delete=models.CASCADE, related_name="itens")
    # PROTECT: um produto que já foi vendido não pode ser excluído.
    produto = models.ForeignKey(
        Produto, verbose_name="produto", on_delete=models.PROTECT, related_name="itens_vendidos"
    )
    quantidade = models.PositiveIntegerField(
        "quantidade", default=1, validators=[MinValueValidator(1)]
    )
    # Preço praticado nesta venda (o preço do produto pode mudar depois).
    valor_unitario = models.DecimalField(
        "valor unitário",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )

    class Meta:
        ordering = ["pk"]
        verbose_name = "produto vendido"
        verbose_name_plural = "produtos vendidos"

    def __str__(self):
        return f"{self.quantidade} × {self.produto}"

    @property
    def subtotal(self):
        return self.quantidade * self.valor_unitario
