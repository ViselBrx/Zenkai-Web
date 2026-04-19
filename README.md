# 🎬🍿 Anime House - Player Local

<p align="center">
  <img src="./assets/tryhard.png" alt="Anime House Logo" width="110" />
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
- Área de autenticação com login, registro (com validação) e exclusão de conta gerenciável no perfil.
- Sistema de Experiência (XP) e gamificação sincronizado com as ações do usuário.
- Loja de Temas para adquirir cosméticos (como o "Tema Cromático") com XP.
- Histórico de uso por usuário e customização visual com diferentes temas de interface.
- Upload de capas e persistência de dados.
- Otimizado e configurado para deploy no Vercel.
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
- **Login e Registro**: fluxo seguro de acesso e criação de conta com confirmação.
- **Perfil**: painel do usuário para edição de conta, exclusão de perfil, visualização do histórico e gerenciamento de "Meus Especiais" (temas equipáveis).
- **Loja (Compras)**: onde os usuários gastam seu XP em temas cosméticos incríveis (ex: Tema Cromático, Tema Neon).
- **Catálogo de Desenhos e Animes**: busca, filtros e modais de detalhes padronizados e interface responsiva.
- **Episódios**: reprodução de episódios com marcação de assistidos, sincronismo de XP e progressão.
- **Cadastro (CRUD)**: gerenciador para adicionar, editar e remover animes, desenhos, filmes e capas associadas.
- **Catálogo de Filmes**: cards de filmes com filtros, detalhes e player.
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
