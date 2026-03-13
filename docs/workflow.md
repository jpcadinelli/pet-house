# Workflow do Projeto

Este documento define um fluxo de trabalho simples para o desenvolvimento do **Pet House**, mantendo o projeto organizado mesmo com uma equipe pequena.

## 1. Objetivo do workflow

O workflow do projeto existe para garantir que:

- cada alteracao tenha um objetivo claro;
- o codigo seja desenvolvido em pequenas entregas;
- a equipe consiga acompanhar o andamento de cada feature;
- a documentacao acompanhe a implementacao.

## 2. Fluxo de desenvolvimento

O ciclo recomendado para cada entrega e:

1. definir a tarefa ou feature;
2. criar uma branch para o trabalho junto com o cartão do trello;
3. implementar a mudanca;
4. atualizar a documentacao da feature e informações do cartão, quando necessario;
5. revisar localmente;
6. abrir um pull request e adicionar link no cartão;
7. compartilhar no grupo o link da pull request.

## 3. Estrategia de branches

Para este projeto, a estrutura abaixo ja atende bem:

- `main`: versao principal e mais estavel do projeto.
- `feature/<nome-da-feature>`: desenvolvimento de novas funcionalidades.
- `fix/<nome-do-ajuste>`: correcao de bugs ou pequenos ajustes.
- `docs/<nome-do-assunto>`: mudancas apenas de documentacao.

### Exemplos

- `feature/auth-logout`
- `feature/mapa-locais`
- `fix/secure-screen-feedback`
- `docs/workflow-inicial`

## 4. Padrao de commits

Os commits devem ser curtos, objetivos e descrever exatamente a mudanca.

Formato sugerido:

- `feat: adiciona logout na autenticacao`
- `fix: corrige exibicao da SecureScreen`
- `docs: adiciona workflow do projeto`
- `refactor: reorganiza estrutura da feature auth`

Tipos recomendados:

- `feat`: nova funcionalidade;
- `fix`: correcao de bug;
- `docs`: documentacao;
- `refactor`: reorganizacao de codigo sem alterar comportamento esperado;
- `style`: ajustes visuais ou de formatacao;
- `test`: criacao ou atualizacao de testes.

## 5. Pull requests

Cada pull request deve focar em uma entrega pequena e clara.

Antes de abrir um PR, verificar:

- se o app inicia normalmente;
- se a feature alterada funciona no fluxo principal;
- se a documentacao foi atualizada, quando aplicavel;
- se nao ha codigo temporario, comentarios desnecessarios ou arquivos fora do escopo.

Descricao minima sugerida para PR:

- objetivo da alteracao;
- arquivos ou areas principais impactadas;
- como validar a mudanca;
- pendencias conhecidas, se existirem.

## 6. Documentacao por feature

Sempre que uma feature ganhar relevancia, criar ou atualizar um arquivo em `docs/features/`.

Cada documento de feature pode seguir esta estrutura:

1. objetivo da feature;
2. telas envolvidas;
3. regras de negocio;
4. dependencias e integracoes;
5. pendencias ou proximos passos.

## 7. Criterios de conclusao de uma tarefa

Uma tarefa pode ser considerada concluida quando:

- o codigo foi implementado;
- a funcionalidade principal foi validada;
- o `README` ou a documentacao da feature foi atualizado, se necessario;
- a branch esta pronta para revisao ou merge;
- o cartão do trello for atualizado com as informações.

## 8. Boas praticas para a equipe

- evitar branches muito longas;
- preferir PRs pequenos;
- documentar decisoes importantes;
- manter nomes de arquivos e pastas coerentes com a estrutura de `src/features`;
- atualizar a documentacao junto com a implementacao, e nao apenas no final.
