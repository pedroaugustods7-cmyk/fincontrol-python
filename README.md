
# 💰 FinControl — Controle Financeiro Pessoal

Aplicação web full stack para gerenciamento de finanças pessoais, desenvolvida com Python, FastAPI, SQLite, HTML, CSS e JavaScript.

O FinControl permite registrar receitas e despesas, acompanhar o saldo financeiro, visualizar gráficos interativos e exportar transações para análise no Excel.

## 🚀 Funcionalidades

- Cadastro de receitas e despesas
- Edição de transações em uma janela interativa
- Exclusão de transações
- Organização por categorias
- Dashboard com receitas, despesas e saldo
- Gráficos interativos com Chart.js
- Evolução financeira mensal
- Filtros por período
- Pesquisa por descrição, tipo e categoria
- Exportação de transações para CSV
- Armazenamento local em banco de dados SQLite
- Interface responsiva

## 🛠️ Tecnologias utilizadas

### Backend
- Python
- FastAPI
- SQLite
- Uvicorn

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js

### Ferramentas
- Visual Studio Code
- Git
- GitHub

## 📁 Estrutura do projeto

```text
FinControl/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── database.py
├── main.py
├── requirements.txt
├── .gitignore
└── README.md
```

O banco de dados local e o ambiente virtual não são enviados ao repositório.

## ⚙️ Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU-USUARIO/fincontrol-python.git
cd fincontrol-python
```

Substitua `SEU-USUARIO` pelo seu usuário do GitHub.

### 2. Criar o ambiente virtual

```bash
python -m venv .venv
```

### 3. Ativar o ambiente virtual

No Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Instalar as dependências

```bash
python -m pip install -r requirements.txt
```

### 5. Iniciar o servidor

```bash
python -m uvicorn main:app --reload --port 8001
```

O backend estará disponível em:

http://127.0.0.1:8001

Documentação interativa da API:

http://127.0.0.1:8001/docs

### 6. Abrir o frontend

Abra o arquivo `frontend/index.html` no navegador.

Mantenha o servidor FastAPI em execução enquanto utiliza a aplicação.

## 📊 Dashboard

O dashboard apresenta:

- Total de receitas do período selecionado
- Total de despesas do período
- Saldo financeiro
- Comparação entre receitas e despesas
- Distribuição de despesas por categoria
- Evolução financeira ao longo dos meses

## 🔌 API REST

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /transacoes | Lista as transações |
| POST | /transacoes | Cadastra uma transação |
| PUT | /transacoes/{id} | Atualiza uma transação |
| DELETE | /transacoes/{id} | Exclui uma transação |
| GET | /saldo | Consulta o saldo financeiro |

## 🔒 Armazenamento

Os dados são armazenados localmente em SQLite.

O arquivo do banco de dados não é incluído no GitHub para evitar a publicação de informações financeiras pessoais.

## 🎯 Objetivo

Este projeto foi desenvolvido para praticar conceitos de desenvolvimento full stack, incluindo:

- Criação de APIs REST
- Operações CRUD
- Integração entre frontend e backend
- Persistência de dados
- Manipulação de dados com JavaScript
- Visualização de informações financeiras
- Organização de projetos com Git e GitHub

## 🔮 Próximas melhorias

- Autenticação de usuários
- Exportação de relatórios em PDF
- Publicação da aplicação na web
- Melhorias na experiência do usuário

---

Desenvolvido como projeto de estudo e portfólio em desenvolvimento full stack.
