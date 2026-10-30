from datetime import date
from unittest import mock

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .forms import ClienteForm
from .models import Cliente
from .validators import cpf_valido, formatar_cpf

CPF_VALIDO = "52998224725"


class CpfTests(TestCase):
    def test_cpf_valido_com_e_sem_mascara(self):
        self.assertTrue(cpf_valido(CPF_VALIDO))
        self.assertTrue(cpf_valido("529.982.247-25"))

    def test_cpf_invalido(self):
        self.assertFalse(cpf_valido("52998224724"))
        self.assertFalse(cpf_valido("11111111111"))
        self.assertFalse(cpf_valido("123"))

    def test_formatar_cpf(self):
        self.assertEqual(formatar_cpf(CPF_VALIDO), "529.982.247-25")


class ClienteModelTests(TestCase):
    @mock.patch("clientes.models.timezone.localdate", return_value=date(2026, 10, 30))
    def test_idade_considera_se_ja_fez_aniversario(self, _):
        self.assertEqual(Cliente(nome="A", data_nascimento=date(1990, 10, 30)).idade, 36)
        self.assertEqual(Cliente(nome="B", data_nascimento=date(1990, 10, 31)).idade, 35)
        self.assertIsNone(Cliente(nome="C").idade)

    def test_cidade_estado(self):
        self.assertEqual(Cliente(cidade="Campinas", estado="SP").cidade_estado, "Campinas/SP")
        self.assertEqual(Cliente(cidade="Campinas").cidade_estado, "Campinas")


class ClienteFormTests(TestCase):
    def test_cpf_com_mascara_e_salvo_so_com_digitos(self):
        form = ClienteForm(data={"nome": "Ana", "cpf": "529.982.247-25"})
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.save().cpf, CPF_VALIDO)

    def test_cpf_invalido_e_recusado(self):
        form = ClienteForm(data={"nome": "Ana", "cpf": "529.982.247-24"})
        self.assertFalse(form.is_valid())
        self.assertIn("cpf", form.errors)

    def test_cpf_repetido_e_recusado(self):
        Cliente.objects.create(nome="Ana", cpf=CPF_VALIDO)
        form = ClienteForm(data={"nome": "Outra", "cpf": CPF_VALIDO})
        self.assertFalse(form.is_valid())
        self.assertEqual(form.errors["cpf"], ["Já existe um cliente com este CPF."])

    def test_whatsapp_com_mascara_e_salvo_so_com_digitos(self):
        form = ClienteForm(data={"nome": "Ana", "whatsapp": "+55 (12) 99133-8866"})
        self.assertTrue(form.is_valid(), form.errors)
        cliente = form.save()
        self.assertEqual(cliente.whatsapp, "12991338866")
        self.assertEqual(cliente.whatsapp_formatado, "(12) 99133-8866")
        self.assertEqual(cliente.whatsapp_link, "https://wa.me/5512991338866")

    def test_whatsapp_incompleto_e_recusado(self):
        form = ClienteForm(data={"nome": "Ana", "whatsapp": "99133-8866"})
        self.assertFalse(form.is_valid())
        self.assertIn("whatsapp", form.errors)

    def test_varios_clientes_sem_cpf(self):
        for nome in ("Ana", "Bia"):
            form = ClienteForm(data={"nome": nome, "cpf": ""})
            self.assertTrue(form.is_valid(), form.errors)
            form.save()
        self.assertEqual(Cliente.objects.filter(cpf__isnull=True).count(), 2)


class ClienteViewTests(TestCase):
    def setUp(self):
        self.usuario = User.objects.create_user("loja", password="senha-forte-123")

    def test_exige_login(self):
        resposta = self.client.get(reverse("clientes:lista"))
        self.assertRedirects(resposta, f"{reverse('login')}?next={reverse('clientes:lista')}")

    def test_cadastrar_e_buscar_cliente(self):
        self.client.force_login(self.usuario)
        resposta = self.client.post(
            reverse("clientes:novo"),
            {"nome": "Maria Souza", "cpf": "529.982.247-25", "cidade": "Recife", "estado": "PE"},
        )
        cliente = Cliente.objects.get()
        self.assertRedirects(resposta, cliente.get_absolute_url())

        resposta = self.client.get(reverse("clientes:lista"), {"q": "529.982"})
        self.assertContains(resposta, "Maria Souza")
        Cliente.objects.filter(pk=cliente.pk).update(empresa="AEA Contabilidade")
        resposta = self.client.get(reverse("clientes:lista"), {"q": "contabilidade"})
        self.assertContains(resposta, "Maria Souza")
        resposta = self.client.get(reverse("clientes:lista"), {"q": "joão"})
        self.assertNotContains(resposta, "Maria Souza")

    def test_cadastro_rapido_responde_json(self):
        self.client.force_login(self.usuario)
        url = reverse("clientes:novo_rapido")

        resposta = self.client.post(url, {"novo_cliente-nome": "Rápida", "novo_cliente-cpf": ""})
        self.assertEqual(resposta.status_code, 200)
        cliente = Cliente.objects.get()
        self.assertEqual(resposta.json(), {"ok": True, "id": cliente.pk, "nome": "Rápida"})

        resposta = self.client.post(url, {"novo_cliente-nome": ""})
        self.assertEqual(resposta.status_code, 400)
        self.assertIn("nome", resposta.json()["erros"])
