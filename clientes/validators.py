import re

from django.core.exceptions import ValidationError


def somente_digitos(valor):
    return re.sub(r"\D", "", valor or "")


def cpf_valido(cpf):
    cpf = somente_digitos(cpf)
    # CPFs com todos os dígitos iguais passam no cálculo, mas são inválidos.
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for tamanho in (9, 10):
        soma = sum(int(cpf[i]) * (tamanho + 1 - i) for i in range(tamanho))
        digito = (soma * 10) % 11 % 10
        if digito != int(cpf[tamanho]):
            return False
    return True


def validar_cpf(valor):
    if not cpf_valido(valor):
        raise ValidationError("CPF inválido.", code="cpf_invalido")


def formatar_cpf(valor):
    cpf = somente_digitos(valor)
    if len(cpf) != 11:
        return valor or ""
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"


def formatar_telefone(valor):
    numero = somente_digitos(valor)
    if numero.startswith("55") and len(numero) in (12, 13):
        numero = numero[2:]
    if len(numero) == 11:
        return f"({numero[:2]}) {numero[2:7]}-{numero[7:]}"
    if len(numero) == 10:
        return f"({numero[:2]}) {numero[2:6]}-{numero[6:]}"
    return valor or ""


def link_whatsapp(valor):
    numero = somente_digitos(valor)
    if len(numero) in (10, 11):
        numero = "55" + numero
    return f"https://wa.me/{numero}" if numero else ""
