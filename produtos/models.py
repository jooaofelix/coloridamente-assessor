from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Produto(models.Model):
    nome = models.CharField("nome", max_length=150)
    preco = models.DecimalField(
        "preço",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    descricao = models.TextField("descrição", blank=True)
    ativo = models.BooleanField(
        "disponível para venda",
        default=True,
        help_text="Desmarque para tirar o produto da lista de venda sem apagar o histórico.",
    )
    criado_em = models.DateTimeField("cadastrado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("atualizado em", auto_now=True)

    class Meta:
        ordering = ["nome"]
        verbose_name = "produto"
        verbose_name_plural = "produtos"

    def __str__(self):
        return self.nome
