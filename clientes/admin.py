from django.contrib import admin

from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ["nome", "cpf_formatado", "email", "cidade", "estado", "data_nascimento"]
    list_filter = ["estado"]
    search_fields = ["nome", "cpf", "email", "cidade"]
