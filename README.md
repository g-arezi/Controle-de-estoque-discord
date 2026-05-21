# 🛒 Bot de Discord - Controle de Estoque

Bot profissional e robusto para gerenciamento de vendas de produtos digitais e físicos diretamente no Discord.

## 📋 Índice

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalação e Setup](#-instalação-e-setup)
- [Como Iniciar o Bot](#-como-iniciar-o-bot)
- [Comandos Disponíveis](#-comandos-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração](#-configuração)
- [Troubleshooting](#-troubleshooting)

## ✨ Características

### Stack Tecnológico

- **Node.js 18+**
- **TypeScript** com strict mode
- **discord.js v14** (Framework Discord)
- **Prisma v5** (ORM)
- **PostgreSQL 16** (Banco de dados)
- **Express 4** (Servidor HTTP para webhooks)

### Funcionalidades

✅ Gerenciamento completo de produtos (CRUD)  
✅ Menu interativo com detalhes de produtos  
✅ Imagens e vídeos nos produtos  
✅ Sistema de checkout integrado  
✅ Controle de estoque em tempo real  
✅ Permissões por administrador  
✅ Rate limiting (1 checkout / 30s por usuário)  
✅ Logging estruturado em JSON  
✅ Transações SERIALIZABLE (sem race conditions)  
✅ Validação rigorosa de entrada

## 🔧 Requisitos

### Sistema

- **Docker e Docker Compose** (recomendado)
- Ou manualmente:
  - Node.js 18+
  - PostgreSQL 16+
  - npm ou yarn


- Token do Bot (do Discord Developer Portal)

## 📦 Instalação e Setup


#### Passo 1: Configure o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto:

```env
# Discord
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=1367944270769819788
ESTOQUE_CHANNEL_ID=1503788015779057735
# DISCORD_GUILD_ID=seu_guild_id (opcional)

# PostgreSQL
POSTGRES_PASSWORD=discord123
DATABASE_URL=postgresql://discord:discord123@postgres:5432/discord_stock?schema=public

# Servidor
PORT=3000

# InfinitePay (opcional)
INFINITEPAY_API_URL=https://api.infinitepay.io
INFINITEPAY_API_KEY=sua_chave_api
INFINITEPAY_SECRET=seu_secret
WEBHOOK_SECRET=seu_webhook_secret_minimo_32_chars
```

#### Passo 2: Inicie os containers

```bash
# Build e inicie
docker compose up -d --build
# Pare quando necessário
docker compose down

### Opção 2: Instalação Manual

#### Passo 1: Instale as dependências

```bash
npm install
```

createdb -U postgres discord_stock
# Configure as credenciais no .env (veja acima)
```

#### Passo 3: Rode as migrações

```bash
npx prisma migrate deploy
```

#### Passo 4: Compile o TypeScript

```bash
npm run build
### Com Docker (Recomendado)
```bash
# Inicie os serviços
docker compose up -d

# Veja os logs
docker compose logs app -f

# Reinicie se necessário
docker compose restart app
# Pare os serviços
docker compose down
```

### Manualmente

```bash
npm install

# 2. Rode as migrações do banco de dados
npx prisma migrate deploy

# 3. Compile o TypeScript
npm run build

# 4. Inicie o bot
node dist/src/main.js
```

### Arquivos Úteis

```bash
# Ver todos os logs
docker compose logs app --tail 100
# Ver apenas erros
docker compose logs app | grep -i error

# Acessar o banco de dados
docker compose exec postgres psql -U discord -d discord_stock
```

## 📝 Comandos Disponíveis

### 1️⃣ `/menu` - Menu de Produtos (Público)

Mostra um menu interativo com todos os produtos disponíveis.

**Uso:**
```
/menu
```

**O que faz:**
- Exibe lista de produtos ativos
- Cada produto tem um botão para ver detalhes
- Ao clicar no produto:
  - Mostra imagem completa (se disponível)
  - Descrição do produto
  - Preço
  - Estoque disponível
  - Categoria e tipo
  - Botões: "Comprar Agora" ou "Voltar ao Menu"

---

### 2️⃣ `/menu-canal` - Menu Separado por Canal (Admin Only) 🔒
**Uso:**
```
/menu-canal
```

**O que faz:**
- Exibe apenas produtos daquele canal
- Ideal para canais como #items, #skins, #contas

**Exemplo de uso:**
1. Crie um canal #skins
2. Adicione produtos com `canal:#skins`
3. No canal #skins, use `/menu-canal`
4. Mostrará apenas skins disponíveis!

---

### 3️⃣ `/comprar` - Compra Rápida (Público)

Inicia checkout direto de um produto pelo ID.

**Uso:**
```
/comprar id:prod_1234567890123
```

**Parâmetros:**
- `id` (obrigatório): ID do produto a comprar

**O que faz:**
- Cria um pedido imediatamente
- Gera link de pagamento
- Mostra Pix copia e cola (se configurado)
- Resserva o produto por 10 minutos
- Quando o pagamento for aprovado, o bot cria um canal privado estilo ticket para a entrega do produto

**Rate Limiting:** Máximo 1 checkout por usuário a cada 30 segundos

---

### 4️⃣ `/estoque` - Gerenciamento de Estoque (Admin Only) 🔒

Comando principal com múltiplos subcomandos para administradores.

#### `/estoque listar` - Listar Produtos

```
/estoque listar
/estoque listar todos:true
```

**Parâmetros:**
- `todos` (opcional): Se `true`, inclui produtos inativos. Padrão: `false`

---

#### `/estoque adicionar` - Adicionar Novo Produto

```
/estoque adicionar 
  nome:"Meu Produto" 
  preco:99.90 
  quantidade:10 
  categoria:"Eletrônicos"
  tipo:ITEMS
  canal:#items
  descricao:"Descrição completa"
  imagem:"https://..."
  video:"https://..."
```

**Parâmetros Obrigatórios:**
- `nome` - Nome do produto
- `preco` - Preço (ex: 99.90)
- `quantidade` - Quantidade em estoque
- `categoria` - Categoria do produto

**Parâmetros Opcionais:**
- `tipo` - Tipo de produto (padrão: DIGITAL)
  - `ITEMS` - Itens do jogo
  - `SKINS` - Skins/aparências
  - `CONTAS` - Contas
  - `PASSE` - Passe de batalha, eventos ou temporada
  - `MODS` - Mods, plugins e complementos
  - `AUXILIARES` - Ferramentas auxiliares e utilitários
  - `REGEDIT` - Arquivos ou ajustes de registro
  - `DIGITAL` - Produtos digitais
- `descricao` - Descrição do produto
- `video` - URL do vídeo do produto

---

#### `/estoque editar` - Editar Produto Existente

  id:prod_1234567890123
  tipo:SKINS
  canal:#skins
  status:ACTIVE
```

**Parâmetros:**
- `id` (obrigatório) - ID do produto a editar
- `nome` (opcional) - Novo nome
- `preco` (opcional) - Novo preço
- `categoria` (opcional) - Nova categoria
- `tipo` (opcional) - Novo tipo (ITEMS, SKINS, CONTAS, PASSE, MODS, AUXILIARES, REGEDIT, DIGITAL, PHYSICAL)
- `canal` (opcional) - Novo canal para associar o produto
- `status` (opcional) - ACTIVE ou INACTIVE
- `descricao` (opcional) - Nova descrição
- `imagem` (opcional) - Nova URL de imagem

---

#### `/estoque remover` - Deletar Produto

```
/estoque remover id:prod_1234567890123
```
⚠️ **Aviso:** Essa ação é permanente!

---

#### `/estoque quantidade` - Ajustar Estoque

```
/estoque quantidade id:prod_1234567890123 quantidade:15
```

---

## 📚 Tipos de Produtos

O sistema suporta estes tipos de produtos:

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `ITEMS` | Itens do jogo | Moedas, armas, equipamentos |
| `SKINS` | Skins/aparências | Skins de jogo, personagens |
| `CONTAS` | Contas de serviços | Contas de Steam, Discord |
| `PASSE` | Passe de batalha ou temporada | Battle pass, season pass |
| `MODS` | Mods e complementos | Mods de jogos, plugins |
| `AUXILIARES` | Ferramentas auxiliares | Utilitários, launchers |
| `REGEDIT` | Ajustes de registro | Tweaks, arquivos `.reg` |
| `DIGITAL` | Produtos digitais | E-books, cursos, softwares |
| `PHYSICAL` | Produtos físicos | Periféricos, livros |

---

## 🎯 Sistema de Canais

```
#items     - Para vender items
#skins     - Para vender skins
#contas    - Para vender contas
```

**2. Adicione produtos em cada canal:**
```
/estoque adicionar 
  nome:"Skin Diamante" 
  preco:29.99 
  quantidade:50 
  tipo:SKINS 
  canal:#skins

/estoque adicionar 
  nome:"Item Ouro" 
  preco:9.99 
  quantidade:100 
  tipo:ITEMS 
  canal:#items
```

**3. Poste o menu em cada canal:**
- No canal `#skins`: `/menu-canal` → Mostra apenas skins
- No canal `#items`: `/menu-canal` → Mostra apenas items
- Em qualquer lugar: `/menu` → Mostra todos os produtos

### Benefícios:
✅ Menus mais limpos e organizados  
✅ Melhor experiência do cliente  
✅ Produtos categorizados por tipo  
✅ Fácil gerenciamento  

---

## 📁 Estrutura do Projeto

```
.
├── docker-compose.yml              # Orquestração de containers
├── Dockerfile                       # Build da aplicação
├── .env                             # Variáveis de ambiente
├── package.json                     # Dependências e scripts
├── tsconfig.json                    # Configuração TypeScript
├── prisma/
│   ├── schema.prisma               # Schema do banco de dados
│   ├── migrations/                 # Migrations do banco
│   └── seed.ts                     # Seed de dados
├── src/
│   ├── main.ts                     # Ponto de entrada
│   ├── config/
│   │   ├── env.ts                  # Validação de env vars
│   │   └── prisma.ts               # Cliente Prisma
│   ├── discord/
│   │   ├── commands.ts             # Definição de slash commands
│   │   ├── interaction-handler.ts  # Handler de interações
│   │   └── register-commands.ts    # Registro de commands
│   ├── lib/
│   │   ├── logger.ts               # Sistema de logs
│   │   └── money.ts                # Formatação de moeda
│   ├── services/
│   │   ├── product.service.ts      # Lógica de produtos
│   │   ├── order.service.ts        # Lógica de pedidos
│   │   ├── payment.service.ts      # Pagamentos (InfinitePay)
│   │   ├── rate-limit.service.ts   # Rate limiting
│   │   └── audit.service.ts        # Auditoria
│   ├── types/
│   │   └── express.d.ts            # Type definitions
│   └── web/
│       └── server.ts               # Servidor Express
└── dist/                            # Código compilado
```

## ⚙️ Configuração

### Arquivo `.env`

Veja o arquivo `.env.example` para referência completa.

### Como obter o Discord Token

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Vá em "Bot" → "Add Bot"
4. Copie o token em "TOKEN"
5. Ative as permissões necessárias:
   - Slash Commands
   - Send Messages
   - Embed Links
   - Attach Files

### Como obter Channel/Guild ID

1. Ative Developer Mode no Discord (User Settings → Advanced)
2. Clique direito no canal/servidor
3. Copie o ID

## 🔍 Troubleshooting

### Bot não responde aos comandos

**Problema:** `/menu` ou `/estoque` não aparecem como opções

**Solução:**
```bash
# Reinicie o bot
docker compose restart app

# Ou manualmente
docker compose down
docker compose up -d --build
```

Se ainda não funcionar:
- Feche e abra o Discord completamente (não apenas minimize)
- Ou aguarde 1 hora para atualização global de comandos

---

### Erro: "Apenas administradores podem..."

**Problema:** Recebe mensagem de permissão negada

**Solução:**
- Verifique se sua conta tem permissão de Administrator no servidor
- Ou peça para um admin usar o comando

---

### Erro de conexão com banco de dados

**Problema:** `Error: P1001: Can't reach database server`

**Solução:**
```bash
# Reinicie os containers
docker compose down
docker compose up -d

# Verifique se o PostgreSQL está rodando
docker compose ps
```

---

### Rate limiting - Não consigo comprar rápido

**Problema:** "Aguarde 30 segundos antes de outro checkout"

**Solução:**
O sistema está protegido contra abuso. Aguarde 30 segundos entre compras do mesmo usuário.

---

### Variáveis de ambiente não carregadas

**Problema:** Bot começa mas não conecta ao banco

**Solução:**
```bash
# Verifique o arquivo .env existe
ls -la .env

# Verifique as variáveis
cat .env

# Reinicie
docker compose restart app
```

### Testar entrega sem API de pagamento

Se você ainda não tem a chave da API, pode simular a aprovação do pagamento em ambiente local e abrir o ticket de entrega assim:

```bash
curl -X POST http://localhost:3000/webhooks/payment/test \
  -H 'Content-Type: application/json' \
  -d '{"order_id":"ord_seu_pedido"}'
```

Isso marca o pedido como `COMPLETED` e cria o canal privado de entrega para o comprador. O endpoint fica liberado enquanto a chave da InfinitePay ainda estiver como placeholder no `.env`.

## 📚 Recursos Adicionais

- [Discord.js Documentação](https://discord.js.org/)
- [Prisma Documentação](https://www.prisma.io/docs/)
- [PostgreSQL Documentação](https://www.postgresql.org/docs/)
- [Docker Documentação](https://docs.docker.com/)

---

**Desenvolvido com ❤️ para o Discord**
