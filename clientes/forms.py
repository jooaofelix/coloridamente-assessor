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

    whatsapp = forms.CharField(
        label="WhatsApp",
        required=False,
        max_length=20,
        widget=forms.TextInput(
            attrs={"placeholder": "(00) 00000-0000", "inputmode": "tel", "data-mascara": "telefone"}
        ),
    )

    class Meta:
        model = Cliente
        fields = [
            "nome",
            "empresa",
            "cpf",
            "data_nascimento",
            "whatsapp",
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
        if not self.is_bound:
            if self.instance.cpf:
                self.initial["cpf"] = self.instance.cpf_formatado
            if self.instance.whatsapp:
                self.initial["whatsapp"] = self.instance.whatsapp_formatado

    def clean_whatsapp(self):
        numero = somente_digitos(self.cleaned_data.get("whatsapp"))
        if numero.startswith("55") and len(numero) in (12, 13):
            numero = numero[2:]
        if numero and len(numero) not in (10, 11):
            raise forms.ValidationError("Informe o DDD e o número, por exemplo (11) 91234-5678.")
        return numero

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
