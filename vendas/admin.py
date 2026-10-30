from django.contrib import admin

from .models import ItemVenda, Venda


class ItemVendaInline(admin.TabularInline):
    model = ItemVenda
    extra = 1
    autocomplete_fields = ["produto"]


@admin.register(Venda)
class VendaAdmin(admin.ModelAdmin):
    list_display = ["id", "data", "cliente", "forma_pagamento", "total"]
    list_filter = ["data", "forma_pagamento"]
    search_fields = ["cliente__nome", "itens__produto__nome"]
    autocomplete_fields = ["cliente"]
    inlines = [ItemVendaInline]
