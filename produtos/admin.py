from django.contrib import admin

from .models import Produto


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ["nome", "preco", "ativo"]
    list_filter = ["ativo"]
    search_fields = ["nome", "descricao"]
