from django import forms

from core.forms import BootstrapFormMixin

from .models import Cliente
from .validators import somente_digitos, validar_cpf


class ClienteForm(BootstrapFormMixin, forms.ModelForm):
    # Aceita o CPF com ou sem máscara; o modelo guarda só os dígitos e valida.
    cpf = forms.CharField(
        label="CPF",
        required=False,
        max_length=14,
        widget=forms.TextInput(
            attrs={"placeholder": "000.000.000-00", "inputmode": "numeric", "data-mascara": "cpf"}
        ),
    )

    class Meta:
        model = Cliente
        fields = [
            "nome",
            "cpf",
            "data_nascimento",
            "email",
            "endereco",
            "cidade",
            "estado",
        ]
        widgets = {
            "nome": forms.TextInput(attrs={"autofocus": True}),
            "data_nascimento": forms.DateInput(attrs={"type": "date"}, format="%Y-%m-%d"),
            "email": forms.EmailInput(attrs={"placeholder": "nome@exemplo.com"}),
            "endereco": forms.TextInput(attrs={"placeholder": "Rua, número, complemento, bairro"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["estado"].choices = [("", "Selecione…"), *Cliente.Estado.choices]
        if self.instance.cpf and not self.is_bound:
            self.initial["cpf"] = self.instance.cpf_formatado

    def clean_cpf(self):
        cpf = somente_digitos(self.cleaned_data.get("cpf"))
        if not cpf:
            return None
        validar_cpf(cpf)
        return cpf


class ClienteRapidoForm(ClienteForm):
    """Cadastro rápido feito de dentro da tela de venda."""

    prefix = "novo_cliente"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["nome"].widget.attrs.pop("autofocus", None)
