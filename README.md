# Meu Player Local - RedeCanais

> Aviso importante:
> Este repositorio e de uso privado e individual. Nao compartilhe acesso, links, arquivos ou qualquer forma de distribuicao publica do projeto.

## Visao Geral

Este projeto oferece um player local desenvolvido com HTML, CSS e JavaScript para assistir conteudo do RedeCanais sem precisar acessar o site diretamente no fluxo principal.

O objetivo e manter uma execucao simples, local e controlada, com inicializacao rapida via Node.js.

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- Node.js
- Git e GitHub
- VS Code

## Requisitos

Antes de iniciar, confirme que voce possui:

- Node.js instalado (recomendado: versao LTS atual)
- Git instalado e configurado no sistema
- VS Code (opcional, mas recomendado)

## Instalacao (Windows)

1. Escolha uma pasta local para salvar o projeto (Area de Trabalho, Documentos ou Downloads).
2. Abra o Git Bash nessa pasta.
3. Execute o comando abaixo para clonar o repositorio:

```bash
git clone https://github.com/ViselBrx/Videos-redecanais.git
```

4. Acesse a pasta do projeto:

```bash
cd Videos-redecanais
```

5. Abra a pasta no VS Code:

```bash
code .
```

## Como Executar

1. No terminal do VS Code (`Ctrl + '`), instale dependencias (se houver `package.json`):

```bash
npm install
```

2. Inicie o servidor local:

```bash
node server.js
```

3. Abra o navegador e acesse:

```text
http://localhost:3000
```

4. Valide se o player carregou corretamente e teste a reproducao.

## Opcional: Executar com Script NPM

Se preferir iniciar via comando NPM, adicione um script no `package.json`:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

Depois, execute:

```bash
npm start
```

## Estrutura Esperada (Exemplo)

```text
Videos-redecanais/
|- server.js
|- package.json
|- public/
|  |- index.html
|  |- css/
|  |- js/
```

## Solucao de Problemas

- `node` nao reconhecido:
  - Reinstale o Node.js e reinicie o terminal.
- Porta `3000` em uso:
  - Altere a porta no `server.js` ou finalize o processo que esta usando a porta.
- Pagina nao abre:
  - Confirme se o servidor iniciou sem erro e se o endereco esta correto (`http://localhost:3000`).

## Boas Praticas

- Mantenha o repositorio privado.
- Nao publique links de acesso local ou versoes hospedadas sem autorizacao.
- Versione mudancas de forma clara com commits objetivos.

## Aviso Legal

Este material e destinado exclusivamente a estudo e uso pessoal no ambiente local do autor. O responsavel pelo projeto deve respeitar os termos de uso dos servicos e o marco legal aplicavel ao conteudo acessado.
