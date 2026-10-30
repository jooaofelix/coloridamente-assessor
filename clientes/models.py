from django.db import models
from django.urls import reverse
from django.utils import timezone

from .validators import formatar_cpf, formatar_telefone, link_whatsapp, validar_cpf


class Cliente(models.Model):
    class Estado(models.TextChoices):
        AC = "AC", "Acre"
        AL = "AL", "Alagoas"
        AP = "AP", "Amapá"
        AM = "AM", "Amazonas"
        BA = "BA", "Bahia"
        CE = "CE", "Ceará"
        DF = "DF", "Distrito Federal"
        ES = "ES", "Espírito Santo"
        GO = "GO", "Goiás"
        MA = "MA", "Maranhão"
        MT = "MT", "Mato Grosso"
        MS = "MS", "Mato Grosso do Sul"
        MG = "MG", "Minas Gerais"
        PA = "PA", "Pará"
        PB = "PB", "Paraíba"
        PR = "PR", "Paraná"
        PE = "PE", "Pernambuco"
        PI = "PI", "Piauí"
        RJ = "RJ", "Rio de Janeiro"
        RN = "RN", "Rio Grande do Norte"
        RS = "RS", "Rio Grande do Sul"
        RO = "RO", "Rondônia"
        RR = "RR", "Roraima"
        SC = "SC", "Santa Catarina"
        SP = "SP", "São Paulo"
        SE = "SE", "Sergipe"
        TO = "TO", "Tocantins"

    nome = models.CharField("nome", max_length=150)
    # Guardado só com dígitos; null para permitir vários clientes sem CPF.
    cpf = models.CharField(
        "CPF",
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        validators=[validar_cpf],
        error_messages={"unique": "Já existe um cliente com este CPF."},
    )
    data_nascimento = models.DateField("data de aniversário", null=True, blank=True)
    # Guardado só com dígitos (DDD + número).
    whatsapp = models.CharField("WhatsApp", max_length=13, blank=True)
    email = models.EmailField("e-mail", blank=True)
    empresa = models.CharField(
        "empresa",
        max_length=150,
        blank=True,
        help_text="Empresa que a pessoa representa, quando o pedido é corporativo.",
    )
    endereco = models.CharField("endereço", max_length=255, blank=True)
    cidade = models.CharField("cidade", max_length=100, blank=True)
    estado = models.CharField("estado", max_length=2, choices=Estado.choices, blank=True)
    criado_em = models.DateTimeField("cadastrado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("atualizado em", auto_now=True)

    class Meta:
        ordering = ["nome"]
        verbose_name = "cliente"
        verbose_name_plural = "clientes"

    def __str__(self):
        return self.nome

    def get_absolute_url(self):
        return reverse("clientes:detalhe", args=[self.pk])

    @property
    def cpf_formatado(self):
        return formatar_cpf(self.cpf)

    @property
    def whatsapp_formatado(self):
        return formatar_telefone(self.whatsapp)

    @property
    def whatsapp_link(self):
        return link_whatsapp(self.whatsapp)

    @property
    def idade(self):
        if not self.data_nascimento:
            return None
        hoje = timezone.localdate()
        nascimento = self.data_nascimento
        ainda_nao_fez = (hoje.month, hoje.day) < (nascimento.month, nascimento.day)
        return hoje.year - nascimento.year - ainda_nao_fez

    @property
    def cidade_estado(self):
        return "/".join(parte for parte in (self.cidade, self.estado) if parte)
