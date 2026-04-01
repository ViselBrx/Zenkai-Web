# 🎬🍿 Anime House - Player Local

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

> 🔒 Projeto pensado para uso local e pessoal.

## ✨ O que o projeto oferece

- Catálogos separados para desenhos, animes, filmes e mangás.
- Área de autenticação com login, registro e perfil.
- Histórico de uso por usuário.
- Upload de capas e persistência de dados.
- Proxy de IA para chat e recursos multimodais.

## 🧰 Tecnologias usadas

<p align="center">
  <img src="https://skillicons.dev/icons?i=html,css,js,nodejs,supabase,git,github,vscode" alt="Tech stack" />
  <br />
  <img src="https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=000000" alt="dotenv amarelo" />
</p>

- VsCode
- HTML, CSS & JavaScript
- Node.js
- Supabase
- Dotenv
- Git
- GitHub

## ⚙️ Configuração

Antes de iniciar, configure o arquivo `.env` com as chaves necessárias:

```env
GROQ_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

## ▶️ Como rodar

```bash
node server.js
```

No Windows, você também pode usar:

```bat
iniciar.bat
```

Acesse: `http://localhost:3000`

## 🌐 Páginas do site e conteúdo

- **Início**: portal principal com atalhos para catálogos, autenticação e área administrativa.
- **Login**: entrada do usuário com validação de conta.
- **Registro**: criação de conta com confirmação.
- **Perfil**: edição de nome/avatar, logout e visualização do histórico.
- **Catálogo de Desenhos**: busca, filtros e visualização de detalhes dos títulos.
- **Episódios de Desenhos**: gerenciamento e reprodução de episódios, com marcação de assistidos.
- **Cadastro de Desenhos**: painel CRUD para criar, editar e remover desenhos e capas.
- **Catálogo de Animes**: listagem com busca, filtros e modal de detalhes.
- **Episódios de Animes**: cadastro e reprodução de episódios por anime, com status de assistido.
- **Cadastro de Animes**: painel CRUD para manutenção de animes e capas.
- **Catálogo de Filmes**: cards de filmes com filtros, detalhes e player.
- **Cadastro de Filmes**: cadastro, edição e exclusão de filmes com capa e iframe/link de exibição.
- **Leitor de Mangás**: organização por mangá e volumes, com upload e links de leitura.
- **Open Anime Agent**: área de IA com chat, leitura de imagem e duelo de personagens.
- **Agradecimento**: tela de créditos e reconhecimento.
- **Home (redirecionamento)**: rota auxiliar que direciona para a página inicial.

## 🔌 API disponível

- `GET /api/data` → retorna dados atuais do sistema.
- `POST /api/save` → salva alterações gerais no estado local.
- `POST /api/upload` → envia imagem e retorna URL pública local.
- `POST /api/ai/proxy` → encaminha chamadas para provedores de IA.

## 📌 Observações

- O sistema foi desenhado para execução local contínua.
- Para usar o frontend normalmente, mantenha o terminal do servidor aberto.
- Recomendado para estudo, organização pessoal e laboratório de integrações.

## 📜 Aviso legal

Projeto voltado para estudo e uso pessoal em ambiente local. Respeite os termos de serviço e a legislação aplicável ao conteúdo acessado.
