# Anime House - Player Local 🎬🍿

<p align="center">
  <img src="./assets/tryhard.png" alt="Anime House Logo" width="110" />
</p>

<p align="center">
  <strong>Plataforma local para catalogar e assistir animes, desenhos, filmes e mangás</strong><br />
  com autenticação, histórico por usuário, perfil, upload de capas/PDFs e assistente Open AnIme 🤖
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-1f8b4c?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/runtime-Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/frontend-HTML%2FCSS%2FJS-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="Frontend" />
</p>

> 🔒 **Uso privado e individual**  
> Não compartilhe acesso, links, arquivos ou qualquer forma de distribuição pública deste projeto.

## 📌 Visão Geral

O projeto roda com servidor Node.js local (`server.js`) e frontend em HTML/CSS/JS puro, com dados sincronizados no Supabase.  
Ele centraliza:

- 🎞️ Catálogo de desenhos, animes e filmes
- 📚 Leitor de mangás com volumes PDF e anotações
- 👤 Login/registro, perfil e avatar
- 🕒 Histórico de reprodução por usuário
- ✅ Marcação de episódios assistidos
- 🤖 Open AnIme (chat + comparação de personagens via proxy de IA)

## 🧰 Tecnologias (com imagens)

<p>
  <img src="https://skillicons.dev/icons?i=html,css,js,nodejs,supabase,git,github,vscode" alt="Tech stack" />
</p>

- `HTML5` + `CSS3` + `JavaScript Vanilla`
- `Node.js` (HTTP server e rotas locais)
- `Supabase` (Auth, Database, Storage e RLS)
- `dotenv` (variáveis de ambiente)

## 🗂️ Estrutura Real do Projeto

```text
Videos-redecanais/
|- assets/
|  |- tryhard.png
|- css/
|  |- style.css
|- js/
|  |- auth.js
|  |- db.js
|  |- themes.js
|  |- history.js
|  |- watched.js
|  |- animes.js / filmes.js / desenhos.js / mangas.js
|  |- cadastro.js / cadastro-animes.js / cadastro-filmes.js
|  |- anime-episodios.js / open-anime.js / opne-anime.js
|- uploads/
|- server.js
|- package.json
|- data.json
|- iniciar.bat
|- *.html
|- *.sql
|- migrate.js / sync-missing-data.js / fix-*.js
```

## 🧩 Componentes por Área

### Frontend (páginas)

- `index.html`: landing/home principal
- `catalogo-desenhos.html`, `animes.html`, `filmes.html`: catálogos
- `desenhos.html`, `anime-episodios.html`: player de episódios
- `mangas.html`: leitor de mangás e volumes
- `cadastro*.html`: telas de gerenciamento/cadastro
- `login.html`, `registro.html`, `perfil.html`: autenticação e perfil
- `open-anime.html`: assistente IA (chat + comparação)

### JavaScript (módulos)

- `js/auth.js`: integração com Supabase Auth
- `js/db.js`: camada de dados (CRUD + upload + integração Supabase)
- `js/history.js`: histórico persistente (`user_watch_history`)
- `js/watched.js`: estado local de assistidos por usuário
- `js/themes.js`: tema global e navegação dinâmica

### Backend local

- `server.js`: servidor HTTP + arquivos estáticos + APIs locais:
  - `GET /api/data`
  - `POST /api/save`
  - `POST /api/upload`
  - `POST /api/ai/proxy`

## 🗄️ Banco e Scripts SQL

Principais scripts deste repositório:

- `supabase_schema.sql`: tabelas base (cartoons, animes, episódios, mangas, settings)
- `profiles.sql`: perfil de usuário e trigger de criação automática
- `capas_storage_setup.sql` e `storage_setup.sql`: buckets e policies de storage
- `mangas_pdf_setup.sql` e `manga_notes_setup.sql`: volumes PDF + anotações
- `watch_history_setup.sql`: histórico de reprodução por usuário
- `ai_chat_history_setup.sql`: histórico de chat da IA
- `user_isolation_migration.sql`: isolamento de dados por `user_id`

## ⚙️ Configuração e Execução

### Pré-requisitos

- `Node.js` (LTS recomendada)
- Conta e projeto no Supabase

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente (`.env`)

```env
GROQ_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### 3. Rodar o projeto

```bash
npm start
```

Ou no Windows:

```bat
iniciar.bat
```

Acesse: `http://localhost:3000`

## 🛠️ Scripts Utilitários

- `migrate.js`: migração inicial de `data.json` para Supabase
- `sync-missing-data.js`: sincronização de dados faltantes
- `fix-data-json.js`, `fix-domains-db.js`, `fix_ai_key.js`: correções pontuais
- `apply-watermark.js`: aplica watermark em páginas HTML

## 🚨 Troubleshooting rápido

- Porta ocupada: altere `PORT` no `.env` ou libere a `3000`
- Erro de autenticação Supabase: confira `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- Upload falhando: valide se os buckets e policies SQL foram criados
- IA sem resposta: confira `GROQ_API_KEY` e a rota `/api/ai/proxy`

## 📜 Aviso Legal

Projeto voltado a estudo e uso pessoal em ambiente local.  
O responsável pelo uso deve respeitar termos de serviço e legislação aplicável ao conteúdo acessado.
