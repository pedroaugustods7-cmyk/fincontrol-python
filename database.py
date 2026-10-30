import sqlite3

def conectar():
    conexao = sqlite3.connect("fincontrol.db")
    return conexao


def criar_tabela():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            tipo TEXT NOT NULL
        )
    """)

    conexao.commit()
    conexao.close()


if __name__ == "__main__":
    criar_tabela()
    print("Banco de dados criado com sucesso!")

    
def adicionar_coluna_categoria():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("PRAGMA table_info(transacoes)")
    colunas = [coluna[1] for coluna in cursor.fetchall()]

    if "categoria" not in colunas:
        cursor.execute(
            "ALTER TABLE transacoes "
            "ADD COLUMN categoria TEXT DEFAULT 'Outros'"
        )

    conexao.commit()
    conexao.close()


def adicionar_coluna_data():
    conexao = conectar()
    cursor = conexao.cursor()

    cursor.execute("PRAGMA table_info(transacoes)")
    colunas = [coluna[1] for coluna in cursor.fetchall()]

    if "data" not in colunas:
        cursor.execute(
            "ALTER TABLE transacoes "
            "ADD COLUMN data TEXT"
        )

    conexao.commit()
    conexao.close()
