# Anime House - Player Local 🎬🍿

<p align="center">
  <img src="./public/assets/tryhard.png" alt="Anime House Logo" width="110" />
</p>

<p align="center">
  <strong>Plataforma local para catalogar e assistir animes, desenhos, filmes e mangás</strong><br />
  com autenticação, histórico por usuário, perfil, upload e assistente Open AnIme 🤖
</p>

> 🔒 **Uso privado e individual**  
> Não compartilhe acesso, links, arquivos ou versões públicas deste projeto.

## ✅ Reorganização Aplicada

A estrutura foi reorganizada para separar claramente:

- `pages/`: páginas HTML do site
- `public/`: arquivos estáticos (CSS, JS, assets, uploads)
- `database/`: SQL organizado por responsabilidade
- `scripts/`: utilitários de migração/manutenção
- `data/`: base local (`data.json`)
- `legacy/`: arquivos antigos/legados

## 🧰 Tecnologias

<p>
  <img src="https://skillicons.dev/icons?i=html,css,js,nodejs,supabase,git,github,vscode" alt="Tech stack" />
</p>

- `HTML5`, `CSS3`, `JavaScript Vanilla`
- `Node.js` (`server.js`)
- `Supabase` (Auth, Database, Storage, RLS)
- `dotenv`

## 🗂️ Estrutura Atual

```text
Videos-redecanais/
|- public/
|  |- assets/
|  |- css/
|  |- js/
|  |- uploads/
|- pages/
|  |- index.html
|  |- animes.html
|  |- filmes.html
|  |- desenhos.html
|  |- anime-episodios.html
|  |- mangas.html
|  |- open-anime.html
|  |- login.html / registro.html / perfil.html
|- database/
|  |- schema/
|  |- storage/
|  |- migrations/
|  |- fixes/
|- scripts/
|  |- migrations/
|  |- maintenance/
|- data/
|  |- data.json
|- legacy/
|- server.js
|- package.json
|- iniciar.bat
```

## 🗄️ SQL Organizado (Importante x Opcional)

### Essencial para o site e database

1. `database/schema/01_core_schema.sql`
2. `database/schema/02_filmes_schema.sql`
3. `database/schema/03_profiles_schema.sql`
4. `database/storage/01_capas_bucket.sql`
5. `database/storage/02_avatars_bucket.sql`
6. `database/schema/04_manga_volumes_and_storage.sql`
7. `database/schema/05_manga_notes.sql`
8. `database/schema/06_watch_history.sql`
9. `database/schema/07_ai_chat_history.sql`

### Importante para isolamento/multiusuário

1. `database/migrations/01_user_isolation.sql`

### Não essencial (manutenção/correção pontual)

1. `database/fixes/01_fix_localhost_capas.sql`
2. `database/fixes/02_rls_ai_config.sql`

## ⚙️ Rodar o Projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar `.env`

```env
GROQ_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### 3. Executar

```bash
npm start
```

Ou no Windows:

```bat
iniciar.bat
```

Acesse: `http://localhost:3000`

## 🧩 Backend e Rotas

Arquivo principal: `server.js`

- `GET /api/data`
- `POST /api/save`
- `POST /api/upload`
- `POST /api/ai/proxy`

Arquivos estáticos saem de `public/` e páginas HTML de `pages/`.

## 🛠️ Scripts Reorganizados

### Migração de dados

- `scripts/migrations/migrate_data_to_supabase.js`
- `scripts/migrations/sync_missing_data.js`

### Manutenção

- `scripts/maintenance/fix_data_json_domains.js`
- `scripts/maintenance/fix_supabase_iframe_domains.js`
- `scripts/maintenance/seed_ai_key_setting.js`
- `scripts/maintenance/apply_watermark_to_pages.js`

## 📜 Aviso Legal

Projeto voltado para estudo e uso pessoal em ambiente local.  
Respeite os termos de serviço e a legislação aplicável ao conteúdo acessado.
