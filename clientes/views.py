from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.db.models import Count, Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views import generic
from django.views.decorators.http import require_POST

from core.views import responder_cadastro_rapido

from .forms import ClienteForm, ClienteRapidoForm
from .models import Cliente
from .validators import somente_digitos


class ClienteListView(LoginRequiredMixin, generic.ListView):
    model = Cliente
    paginate_by = 20
    template_name = "clientes/lista.html"

    def get_queryset(self):
        clientes = Cliente.objects.annotate(qtd_vendas=Count("vendas")).order_by("nome")
        busca = self.request.GET.get("q", "").strip()
        if busca:
            filtro = (
                Q(nome__icontains=busca)
                | Q(empresa__icontains=busca)
                | Q(email__icontains=busca)
                | Q(cidade__icontains=busca)
            )
            digitos = somente_digitos(busca)
            if digitos:
                filtro |= Q(cpf__contains=digitos) | Q(whatsapp__contains=digitos)
            clientes = clientes.filter(filtro)
        return clientes

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["busca"] = self.request.GET.get("q", "").strip()
        return context


class ClienteDetailView(LoginRequiredMixin, generic.DetailView):
    model = Cliente
    template_name = "clientes/detalhe.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        vendas = self.object.vendas.prefetch_related("itens__produto")
        context["vendas"] = vendas
        context["total_comprado"] = sum(venda.total for venda in vendas)
        return context


class ClienteCreateView(LoginRequiredMixin, SuccessMessageMixin, generic.CreateView):
    model = Cliente
    form_class = ClienteForm
    template_name = "clientes/form.html"
    success_message = "Cliente %(nome)s cadastrado."


class ClienteUpdateView(LoginRequiredMixin, SuccessMessageMixin, generic.UpdateView):
    model = Cliente
    form_class = ClienteForm
    template_name = "clientes/form.html"
    success_message = "Dados de %(nome)s atualizados."


class ClienteDeleteView(LoginRequiredMixin, generic.DeleteView):
    model = Cliente
    template_name = "clientes/excluir.html"
    success_url = reverse_lazy("clientes:lista")

    def form_valid(self, form):
        nome = self.object.nome
        try:
            self.object.delete()
        except ProtectedError:
            messages.error(
                self.request,
                f"{nome} tem vendas registradas e não pode ser excluído(a). "
                "Exclua as vendas antes, se for mesmo necessário.",
            )
            return redirect(self.object)
        messages.success(self.request, f"Cliente {nome} excluído(a).")
        return redirect(self.success_url)


@login_required
@require_POST
def cliente_rapido(request):
    return responder_cadastro_rapido(
        ClienteRapidoForm(request.POST),
        lambda cliente: {"id": cliente.pk, "nome": cliente.nome},
    )
