from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import transaction
from django.db.models import Q
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views import generic

from clientes.forms import ClienteRapidoForm
from clientes.models import Cliente
from produtos.forms import ProdutoRapidoForm
from produtos.models import Produto

from .forms import ItemVendaFormSet, VendaForm
from .models import Venda


class VendaListView(LoginRequiredMixin, generic.ListView):
    model = Venda
    paginate_by = 20
    template_name = "vendas/lista.html"

    def get_queryset(self):
        vendas = Venda.objects.select_related("cliente").prefetch_related("itens__produto")
        busca = self.request.GET.get("q", "").strip()
        if busca:
            vendas = vendas.filter(
                Q(cliente__nome__icontains=busca) | Q(itens__produto__nome__icontains=busca)
            ).distinct()
        return vendas

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["busca"] = self.request.GET.get("q", "").strip()
        return context


class VendaDetailView(LoginRequiredMixin, generic.DetailView):
    model = Venda
    template_name = "vendas/detalhe.html"

    def get_queryset(self):
        return Venda.objects.select_related("cliente").prefetch_related("itens__produto")


class VendaFormMixin:
    """Salva a venda e os produtos vendidos juntos (tudo ou nada)."""

    model = Venda
    form_class = VendaForm
    template_name = "vendas/form.html"
    success_message = ""

    def get_formset(self):
        if self.request.method == "POST":
            return ItemVendaFormSet(self.request.POST, instance=self.object, prefix="itens")
        return ItemVendaFormSet(instance=self.object, prefix="itens")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if "formset" not in context:
            context["formset"] = self.get_formset()
        context["form_novo_cliente"] = ClienteRapidoForm()
        context["form_novo_produto"] = ProdutoRapidoForm()
        context["tem_produtos"] = Produto.objects.filter(ativo=True).exists()
        return context

    def post(self, request, *args, **kwargs):
        form = self.get_form()
        formset = self.get_formset()
        if form.is_valid() and formset.is_valid():
            with transaction.atomic():
                self.object = form.save()
                formset.instance = self.object
                formset.save()
            messages.success(request, self.success_message)
            return redirect(self.object)
        return self.render_to_response(self.get_context_data(form=form, formset=formset))


class VendaCreateView(LoginRequiredMixin, VendaFormMixin, generic.CreateView):
    success_message = "Venda registrada."

    def get_initial(self):
        initial = super().get_initial()
        # Permite abrir "Nova venda" já com o cliente escolhido (?cliente=ID).
        cliente_id = self.request.GET.get("cliente")
        if cliente_id and Cliente.objects.filter(pk=cliente_id).exists():
            initial["cliente"] = cliente_id
        return initial

    def post(self, request, *args, **kwargs):
        self.object = None
        return super().post(request, *args, **kwargs)


class VendaUpdateView(LoginRequiredMixin, VendaFormMixin, generic.UpdateView):
    success_message = "Venda atualizada."

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super().post(request, *args, **kwargs)


class VendaDeleteView(LoginRequiredMixin, generic.DeleteView):
    model = Venda
    template_name = "vendas/excluir.html"
    success_url = reverse_lazy("vendas:lista")

    def form_valid(self, form):
        messages.success(self.request, f"Venda #{self.object.pk} excluída.")
        return super().form_valid(form)
