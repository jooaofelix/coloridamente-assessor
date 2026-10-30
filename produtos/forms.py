from django import forms

from core.forms import BootstrapFormMixin

from .models import Produto


class ProdutoForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Produto
        fields = ["nome", "categoria", "preco", "descricao", "ativo"]
        labels = {"preco": "Preço (R$)"}
        widgets = {
            "nome": forms.TextInput(attrs={"autofocus": True}),
            "preco": forms.NumberInput(attrs={"min": 0, "step": "0.01", "placeholder": "0,00"}),
            "descricao": forms.Textarea(attrs={"rows": 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["categoria"].choices = [("", "Sem categoria"), *Produto.Categoria.choices]

    def clean_nome(self):
        nome = " ".join(self.cleaned_data["nome"].split())
        repetidos = Produto.objects.filter(nome__iexact=nome).exclude(pk=self.instance.pk)
        if repetidos.exists():
            raise forms.ValidationError("Já existe um produto com este nome.")
        return nome


class ProdutoRapidoForm(ProdutoForm):
    """Cadastro rápido feito de dentro da tela de venda (produto já nasce ativo)."""

    prefix = "novo_produto"

    class Meta(ProdutoForm.Meta):
        fields = ["nome", "categoria", "preco", "descricao"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["nome"].widget.attrs.pop("autofocus", None)
