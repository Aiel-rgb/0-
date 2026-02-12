# Peak Habit - Gamified Task Manager 🏰

Um gerenciador de tarefas gamificado com elementos de RPG, onde você evolui seu personagem completando missões da vida real!

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (versão 18 ou superior)
2. **MySQL** (ou Docker para rodar o banco via container)

## 🚀 Instalação

1. **Extraia o projeto** (se estiver vindo de um arquivo .zip).
2. Abra o terminal na **pasta raiz** do projeto.
3. Instale as dependências:

```bash
npm install
```

## 🗄️ Configuração do Banco de Dados

### Opção A: Usando Docker (Recomendado)

Se você tem Docker instalado, basta rodar:

```bash
docker-compose up -d
```

### Opção B: MySQL Local

Se preferir usar um MySQL local instalado no seu PC:

1. Crie um banco de dados chamado `peak_habit`.
2. Configure a variável de ambiente (veja abaixo).

### Configurar Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto (copie o conteúdo abaixo):

```env
# URL de conexão com o Banco de Dados
# Se usar Docker: mysql://user:userpassword@localhost:3306/peak_habit
# Se usar MySQL local, ajuste user:password e a porta
DATABASE_URL="mysql://user:userpassword@localhost:3306/peak_habit"

# (Opcional) Outras configurações podem ir aqui
```

### Criar as Tabelas (Migração)

Após configurar o banco, rode o comando para criar as tabelas:

```bash
npm run db:push
```

## ▶️ Como Rodar

**Atenção:** Certifique-se de estar na **pasta raiz** (onde está o arquivo `package.json`), e não dentro da pasta `client`.

Rode o comando:

```bash
npm run dev
```

O projeto estará acessível em: `http://localhost:3000` (ou outra porta indicada no terminal).

## 🛠️ Tecnologias

- **Frontend**: React, Vite, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, tRPC
- **Banco de Dados**: MySQL, Drizzle ORM
- **Linguagem**: TypeScript

## 🎮 Funcionalidades Principais

- **RPG System**: XP, Níveis, Atributos e Ouro.
- **Masmorra**: Mapa interativo com missões, chefes e andares.
- **Streak**: Contador de dias consecutivos (sequência).
- **Loja**: Gaste seu ouro em itens cosméticos e poções.
- **Estatísticas**: Gráficos reais do seu progresso.
