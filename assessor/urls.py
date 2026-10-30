from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("", include("core.urls")),
    path("clientes/", include("clientes.urls")),
    path("produtos/", include("produtos.urls")),
    path("vendas/", include("vendas.urls")),
    path("contas/", include("django.contrib.auth.urls")),
    path("admin/", admin.site.urls),
]
