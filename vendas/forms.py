from django import forms
from django.db.models import Q

from core.forms import BootstrapFormMixin
from produtos.models import Produto

from .models import ItemVenda, Venda


class VendaForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Venda
        fields = ["cliente", "data", "ocasiao", "forma_pagamento", "observacoes"]
        widgets = {
            "data": forms.DateInput(attrs={"type": "date"}, format="%Y-%m-%d"),
            "observacoes": forms.Textarea(
                attrs={"rows": 3, "placeholder": "Como foi o atendimento, pedidos especiais, combinados…"}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["cliente"].empty_label = "Escolha o cliente…"
        self.fields["forma_pagamento"].choices = [("", "Não informada"), *Venda.FormaPagamento.choices]
        self.fields["ocasiao"].choices = [("", "Não informada"), *Venda.Ocasiao.choices]


class ProdutoSelect(forms.Select):
    """Leva o preço de cada produto no <option>, para a tela preencher o valor sozinha."""

    def create_option(self, name, value, label, selected, index, subindex=None, attrs=None):
        option = super().create_option(name, value, label, selected, index, subindex, attrs)
        produto = getattr(value, "instance", None)
        if produto is not None and produto.preco is not None:
            option["attrs"]["data-preco"] = str(produto.preco)
        return option


class ItemVendaForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = ItemVenda
        fields = ["produto", "quantidade", "valor_unitario"]
        widgets = {
            "produto": ProdutoSelect(attrs={"data-campo": "produto"}),
            "quantidade": forms.NumberInput(attrs={"min": 1, "data-campo": "quantidade"}),
            "valor_unitario": forms.NumberInput(
                attrs={"min": 0, "step": "0.01", "placeholder": "0,00", "data-campo": "valor"}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Só aparecem produtos disponíveis, mas uma venda antiga mantém o seu.
        disponiveis = Q(ativo=True)
        if self.instance.produto_id:
            disponiveis |= Q(pk=self.instance.produto_id)
        self.fields["produto"].queryset = Produto.objects.filter(disponiveis)
        self.fields["produto"].empty_label = "Escolha o produto…"
        self.fields["valor_unitario"].required = False

    def clean(self):
        dados = super().clean()
        # Valor em branco: usa o preço cadastrado do produto, se houver.
        produto = dados.get("produto")
        if produto and dados.get("valor_unitario") is None:
            if produto.preco is None:
                self.add_error("valor_unitario", "Informe o valor: este produto é sob orçamento.")
            else:
                dados["valor_unitario"] = produto.preco
        return dados


class BaseItemVendaFormSet(forms.BaseInlineFormSet):
    default_error_messages = {
        **forms.BaseInlineFormSet.default_error_messages,
        "too_few_forms": "Informe pelo menos um produto vendido.",
    }


ItemVendaFormSet = forms.inlineformset_factory(
    Venda,
    ItemVenda,
    form=ItemVendaForm,
    formset=BaseItemVendaFormSet,
    extra=0,
    min_num=1,
    validate_min=True,
    can_delete=True,
)
