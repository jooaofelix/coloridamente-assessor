from decimal import Decimal, InvalidOperation

from django import template

register = template.Library()


@register.filter
def brl(valor):
    """Formata um número como moeda brasileira: 1234.5 -> R$ 1.234,50."""
    try:
        valor = Decimal(valor or 0).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return valor
    texto = f"{valor:,.2f}".replace(",", "_").replace(".", ",").replace("_", ".")
    return f"R$ {texto}"


@register.simple_tag(takes_context=True)
def aba_ativa(context, prefixo):
    """Marca a aba do menu correspondente à página atual."""
    caminho = context["request"].path
    if prefixo == "/":
        return "active" if caminho == "/" else ""
    return "active" if caminho.startswith(prefixo) else ""
