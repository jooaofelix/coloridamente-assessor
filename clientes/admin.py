from django.contrib import admin

from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ["nome", "empresa", "cpf_formatado", "whatsapp_formatado", "email", "cidade", "estado"]
    list_filter = ["estado"]
    search_fields = ["nome", "empresa", "cpf", "whatsapp", "email", "cidade"]
