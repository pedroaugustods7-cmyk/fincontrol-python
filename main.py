
import sqlite3
from datetime import date
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import (
    conectar,
    criar_tabela,
    adicionar_coluna_categoria,
    adicionar_coluna_data
)

# Criar aplicação
app = FastAPI(title="FinControl API")

# Permitir comunicação com o frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["null"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Preparar banco de dados
criar_tabela()
adicionar_coluna_categoria()
adicionar_coluna_data()


# Modelo de transação
class Transacao(BaseModel):
    descricao: str = Field(min_length=1)
    valor: float = Field(gt=0)
    tipo: Literal["receita", "despesa"]
    categoria: str = "Outros"
    data: date = Field(default_factory=date.today)


# Página inicial
@app.get("/")
def inicio():
    return {"mensagem": "Bem-vindo ao FinControl!"}


# Adicionar uma transação
@app.post("/transacoes")
def adicionar_transacao(transacao: Transacao):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        """
        INSERT INTO transacoes
        (descricao, valor, tipo, categoria, data)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            transacao.descricao,
            transacao.valor,
            transacao.tipo,
            transacao.categoria,
            transacao.data.isoformat()
        )
    )

    conexao.commit()
    novo_id = cursor.lastrowid
    conexao.close()

    return {
        "mensagem": "Transação salva com sucesso!",
        "id": novo_id
    }


# Listar transações
@app.get("/transacoes")
def listar_transacoes():
    conexao = conectar()
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()

    cursor.execute(
        "SELECT * FROM transacoes ORDER BY id DESC"
    )

    registros = cursor.fetchall()
    transacoes = [dict(registro) for registro in registros]

    conexao.close()
    return transacoes


# Calcular receitas, despesas e saldo
@app.get("/saldo")
def calcular_saldo():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT tipo, SUM(valor)
        FROM transacoes
        GROUP BY tipo
    """)

    resultados = cursor.fetchall()
    conexao.close()

    receitas = 0
    despesas = 0

    for tipo, total in resultados:
        if tipo == "receita":
            receitas = total
        elif tipo == "despesa":
            despesas = total

    return {
        "receitas": receitas,
        "despesas": despesas,
        "saldo": receitas - despesas
    }


# Excluir transação
@app.delete("/transacoes/{transacao_id}")
def excluir_transacao(transacao_id: int):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        "DELETE FROM transacoes WHERE id = ?",
        (transacao_id,)
    )

    if cursor.rowcount == 0:
        conexao.close()
        raise HTTPException(
            status_code=404,
            detail="Transação não encontrada"
        )

    conexao.commit()
    conexao.close()

    return {"mensagem": "Transação excluída com sucesso!"}


# Editar transação
@app.put("/transacoes/{transacao_id}")
def editar_transacao(transacao_id: int, transacao: Transacao):
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE transacoes
        SET descricao = ?,
            valor = ?,
            tipo = ?,
            categoria = ?,
            data = ?
        WHERE id = ?
        """,
        (
            transacao.descricao,
            transacao.valor,
            transacao.tipo,
            transacao.categoria,
            transacao.data.isoformat(),
            transacao_id
        )
    )

    if cursor.rowcount == 0:
        conexao.close()
        raise HTTPException(
            status_code=404,
            detail="Transação não encontrada"
        )

    conexao.commit()
    conexao.close()

    return {"mensagem": "Transação atualizada com sucesso!"}
