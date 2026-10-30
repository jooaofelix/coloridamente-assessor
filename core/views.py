from decimal import Decimal

from django.contrib.auth.decorators import login_required
from django.db.models import DecimalField, F, Sum
from django.db.models.functions import ExtractDay
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone

from clientes.models import Cliente
from vendas.models import ItemVenda, Venda


@login_required
def inicio(request):
    hoje = timezone.localdate()
    inicio_do_mes = hoje.replace(day=1)

    vendas_do_mes = Venda.objects.filter(data__gte=inicio_do_mes, data__lte=hoje)
    faturamento_do_mes = ItemVenda.objects.filter(venda__in=vendas_do_mes).aggregate(
        total=Sum(F("quantidade") * F("valor_unitario"), output_field=DecimalField())
    )["total"] or Decimal("0")

    aniversariantes = (
        Cliente.objects.filter(data_nascimento__month=hoje.month)
        .annotate(dia=ExtractDay("data_nascimento"))
        .order_by("dia", "nome")
    )

    contexto = {
        "hoje": hoje,
        "total_clientes": Cliente.objects.count(),
        "qtd_vendas_do_mes": vendas_do_mes.count(),
        "faturamento_do_mes": faturamento_do_mes,
        "aniversariantes": aniversariantes,
        "ultimas_vendas": Venda.objects.select_related("cliente").prefetch_related("itens__produto")[:5],
    }
    return render(request, "core/inicio.html", contexto)


def responder_cadastro_rapido(form, dados):
    """Resposta JSON para os cadastros feitos dentro de outra tela (janela modal)."""
    if form.is_valid():
        objeto = form.save()
        return JsonResponse({"ok": True, **dados(objeto)})
    return JsonResponse({"ok": False, "erros": form.errors.get_json_data()}, status=400)
