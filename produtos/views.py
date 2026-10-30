from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.db.models import Q, Sum
from django.db.models.deletion import ProtectedError
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views import generic
from django.views.decorators.http import require_POST

from core.views import responder_cadastro_rapido

from .forms import ProdutoForm, ProdutoRapidoForm
from .models import Produto


class ProdutoListView(LoginRequiredMixin, generic.ListView):
    model = Produto
    paginate_by = 20
    template_name = "produtos/lista.html"

    def get_queryset(self):
        produtos = Produto.objects.annotate(qtd_vendida=Sum("itens_vendidos__quantidade")).order_by(
            "-ativo", "nome"
        )
        busca = self.request.GET.get("q", "").strip()
        if busca:
            produtos = produtos.filter(Q(nome__icontains=busca) | Q(descricao__icontains=busca))
        return produtos

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["busca"] = self.request.GET.get("q", "").strip()
        return context


class ProdutoCreateView(LoginRequiredMixin, SuccessMessageMixin, generic.CreateView):
    model = Produto
    form_class = ProdutoForm
    template_name = "produtos/form.html"
    success_url = reverse_lazy("produtos:lista")
    success_message = "Produto %(nome)s cadastrado."


class ProdutoUpdateView(LoginRequiredMixin, SuccessMessageMixin, generic.UpdateView):
    model = Produto
    form_class = ProdutoForm
    template_name = "produtos/form.html"
    success_url = reverse_lazy("produtos:lista")
    success_message = "Produto %(nome)s atualizado."


class ProdutoDeleteView(LoginRequiredMixin, generic.DeleteView):
    model = Produto
    template_name = "produtos/excluir.html"
    success_url = reverse_lazy("produtos:lista")

    def form_valid(self, form):
        nome = self.object.nome
        try:
            self.object.delete()
        except ProtectedError:
            messages.error(
                self.request,
                f"{nome} já aparece em vendas e não pode ser excluído. "
                "Para tirá-lo da lista de venda, edite e desmarque “disponível para venda”.",
            )
            return redirect("produtos:editar", pk=self.object.pk)
        messages.success(self.request, f"Produto {nome} excluído.")
        return redirect(self.success_url)


@login_required
@require_POST
def produto_rapido(request):
    return responder_cadastro_rapido(
        ProdutoRapidoForm(request.POST),
        lambda produto: {"id": produto.pk, "nome": produto.nome, "preco": str(produto.preco)},
    )
