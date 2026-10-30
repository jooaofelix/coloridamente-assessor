from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Produto(models.Model):
    # As mesmas categorias do site (Linha Office).
    class Categoria(models.TextChoices):
        AGENDAS_E_CADERNOS = "agendas-e-cadernos", "Agendas e cadernos"
        PAPELARIA_CORPORATIVA = "papelaria-corporativa", "Papelaria corporativa"
        BRINDES_PERSONALIZADOS = "brindes-personalizados", "Brindes personalizados"
        ACESSORIOS_PARA_ESCRITORIO = "acessorios-para-escritorio", "Acessórios para escritório"

    nome = models.CharField("nome", max_length=150)
    categoria = models.CharField(
        "categoria", max_length=40, choices=Categoria.choices, blank=True
    )
    # Opcional: na Coloridamente o valor costuma sair do orçamento
    # (produto, quantidade e personalização).
    preco = models.DecimalField(
        "preço",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Deixe em branco se o valor depende do orçamento. Na venda, o valor é informado na hora.",
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
