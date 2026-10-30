"""Cadastra os produtos da Linha Office, com nome e descrição iguais aos do site.

Sem preço: na Coloridamente o valor sai do orçamento (produto, quantidade e personalização).
"""

from django.db import migrations

LINHA_OFFICE = [
    {
        "nome": "Agenda 2027",
        "categoria": "agendas-e-cadernos",
        "descricao": "Agenda diária com horários, minicalendário do mês e quadro de anotações, com a marca na capa.",
    },
    {
        "nome": "Kit de acessórios para escritório",
        "categoria": "acessorios-para-escritorio",
        "descricao": "Suporte de celular, porta-lápis, bandeja oval e porta-clipes em preto, com acabamento canelado.",
    },
    {
        "nome": "Caderno com capa personalizada",
        "categoria": "agendas-e-cadernos",
        "descricao": "Capa branca com a marca e ondas em tons de azul, com encadernação em espiral.",
    },
    {
        "nome": "Caderno pautado personalizado",
        "categoria": "agendas-e-cadernos",
        "descricao": (
            "Folhas pautadas com a marca no topo e o grafismo da capa nos cantos. "
            "Também disponível com folhas sem pauta."
        ),
    },
]


def cadastrar(apps, schema_editor):
    Produto = apps.get_model("produtos", "Produto")
    for dados in LINHA_OFFICE:
        if not Produto.objects.filter(nome__iexact=dados["nome"]).exists():
            Produto.objects.create(**dados)


def remover(apps, schema_editor):
    Produto = apps.get_model("produtos", "Produto")
    Produto.objects.filter(
        nome__in=[dados["nome"] for dados in LINHA_OFFICE], itens_vendidos__isnull=True
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("produtos", "0002_categoria_e_preco_opcional"),
        ("vendas", "0001_initial"),
    ]

    operations = [migrations.RunPython(cadastrar, remover)]
