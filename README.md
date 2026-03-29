<h1 align="center">Anime House - Player Local 🎬🍿</h1>

<p align="center">
  <img src="./public/assets/tryhard.png" alt="Anime House Logo" width="110" />
</p>

<p align="center">
  <strong>Plataforma local para organizar e assistir animes, desenhos, filmes e mangás</strong><br />
  com autenticação, perfil de usuário, histórico e integração com Supabase.
</p>

<p align="center">
  🎞️ Organizado • 🔐 Privado • ⚡ Local
</p>

> 🔒 Uso pensado para ambiente local e privado.

## 📁 Reorganização aplicada

A estrutura foi organizada para separar melhor as responsabilidades do projeto:

- `pages/`: páginas HTML
- `public/`: CSS, JS, assets e uploads
- `database/`: SQL separado por finalidade
- `scripts/`: utilitários de migração e manutenção
- `data/`: base local do projeto
- `legacy/`: arquivos antigos

## 🧰 Tecnologias usadas

<p>
  <img src="https://skillicons.dev/icons?i=html,css,js,nodejs,supabase,git,github,vscode" alt="Tech stack" />
</p>

- `HTML5`, `CSS3` e `JavaScript`
- `Node.js`
- `Supabase`
- `dotenv`
- `Git` e `GitHub`

## 📥 Como clonar

```bash
git clone <URL_DO_REPOSITORIO>
```

> 💡 Substitua `<URL_DO_REPOSITORIO>` pela URL do repositório.

## ⚙️ Configuração

Antes de iniciar, configure o arquivo `.env` com as chaves necessárias:

```env
GROQ_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

## 🏗️ Estrutura atual

```text
Videos-redecanais/
|- public/
|  |- assets/
|  |- css/
|  |- js/
|  |- uploads/
|- pages/
|- database/
|  |- schema/
|  |- storage/
|  |- migrations/
|  |- fixes/
|- scripts/
|  |- migrations/
|  |- maintenance/
|- data/
|- legacy/
|- server.js
|- package.json
|- iniciar.bat
```

## 🗃️ SQL organizado

### ✅ Essencial

- `database/schema/01_core_schema.sql`
- `database/schema/02_filmes_schema.sql`
- `database/schema/03_profiles_schema.sql`
- `database/storage/01_capas_bucket.sql`
- `database/storage/02_avatars_bucket.sql`
- `database/schema/04_manga_volumes_and_storage.sql`
- `database/schema/05_manga_notes.sql`
- `database/schema/06_watch_history.sql`
- `database/schema/07_ai_chat_history.sql`

### ⭐ Importante

- `database/migrations/01_user_isolation.sql`

### 🧩 Opcional

- `database/fixes/01_fix_localhost_capas.sql`
- `database/fixes/02_rls_ai_config.sql`

## ▶️ Como rodar

```bash
node server.js
```

Ou, no Windows:

```bat
iniciar.bat
```

> 🚀 Acesse: `http://localhost:3000`

## 🌐 Backend e rotas

Arquivo principal: `server.js`

- `GET /api/data`
- `POST /api/save`
- `POST /api/upload`
- `POST /api/ai/proxy`

Arquivos estáticos saem de `public/` e as páginas HTML ficam em `pages/`.

## 🛠️ Scripts reorganizados

### 🔄 Migração de dados

- `scripts/migrations/migrate_data_to_supabase.js`
- `scripts/migrations/sync_missing_data.js`

### 🧹 Manutenção

- `scripts/maintenance/fix_data_json_domains.js`
- `scripts/maintenance/fix_supabase_iframe_domains.js`
- `scripts/maintenance/seed_ai_key_setting.js`
- `scripts/maintenance/apply_watermark_to_pages.js`

## 📜 Aviso legal

Projeto voltado para estudo e uso pessoal em ambiente local. Respeite os termos de serviço e a legislação aplicável ao conteúdo acessado.
"# Videos-redecanais-mobile" 
# Videos-redecanais-mobile
