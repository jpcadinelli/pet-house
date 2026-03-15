# Barra de navegacao inferior

## Titulo

Adicao de barra de navegacao inferior para acesso as telas principais do aplicativo.

## Objetivo

Implementar uma barra de navegacao inferior no aplicativo Pet House para permitir a navegacao entre tres areas principais da aplicacao:

- empreendimentos pet abertos agora;
- mapa;
- perfil.

A implementacao deve considerar a estrutura atual do projeto, onde ja existem as telas `HomeScreen` para usuario nao autenticado e `SecureScreen` para usuario autenticado, exigindo refatoracao do fluxo atual para suportar a navegacao entre telas dentro da area autenticada.

Nesta primeira etapa, as telas de mapa e empreendimentos terao apenas conteudo descritivo.

## Contexto

Atualmente o aplicativo possui:

- `HomeScreen`, exibida quando o usuario nao esta logado;
- `SecureScreen`, exibida quando o usuario esta logado;
- tela de perfil do usuario prevista para entrega futura.

Este requisito introduz a navegacao por abas inferiores para organizar o fluxo entre as principais areas do aplicativo.

## Descricao do requisito

O sistema deve disponibilizar uma barra de navegacao inferior na area autenticada do aplicativo permitindo navegacao entre tres abas principais:

- Empreendimentos;
- Mapa;
- Perfil.

A aba `Mapa` deve ser a tela inicial da navegacao.

Nesta fase inicial, a aba `Perfil` nao exibira a futura tela de perfil. Sempre que o usuario acessar esta aba, ele devera ser direcionado para a `HomeScreen`.

A visualizacao especifica de perfil para usuario autenticado sera implementada em entrega futura.

## Regras de negocio

### RN01 - Exibicao da barra de navegacao

A barra de navegacao inferior deve ser exibida apenas quando o usuario estiver na area autenticada do aplicativo.

### RN02 - Fluxo para usuario nao autenticado

Quando o usuario nao estiver autenticado, o aplicativo deve continuar exibindo a `HomeScreen`, sem barra de navegacao inferior.

### RN03 - Fluxo para usuario autenticado

Quando o usuario estiver autenticado, o aplicativo deve exibir a estrutura com barra de navegacao inferior, substituindo o fluxo atual da `SecureScreen` isolada.

### RN04 - Tela inicial

Ao entrar na area autenticada, a aba inicial exibida deve ser a tela de `Mapa`.

### RN05 - Ordem das abas

A barra de navegacao inferior deve possuir a seguinte disposicao:

- esquerda: tela de empreendimentos pet abertos agora;
- centro: tela de mapa;
- direita: aba de perfil.

### RN06 - Conteudo inicial da tela de mapa

Nesta primeira versao, a tela de mapa deve exibir apenas um texto descritivo.

Exemplo: `Esta e a tela de mapa.`

### RN07 - Conteudo inicial da tela de empreendimentos

Nesta primeira versao, a tela de empreendimentos deve exibir apenas um texto descritivo.

Exemplo: `Esta e a tela de empreendimentos pet abertos agora.`

### RN08 - Comportamento da aba de perfil

Ao selecionar a aba `Perfil`, o sistema deve redirecionar o usuario para a `HomeScreen`.

### RN09 - Implementacao futura do perfil

A visualizacao de perfil do usuario autenticado nao faz parte deste requisito e sera implementada posteriormente.

### RN10 - Funcionalidades futuras fora do escopo

As seguintes funcionalidades nao fazem parte deste requisito:

- carregamento do mapa;
- exibicao de empreendimentos no mapa;
- filtros de empreendimentos;
- listagem dinamica de dados;
- tela de perfil autenticado.

## Criterios de aceite

### CA01

Dado que o usuario nao esta logado, quando acessar o aplicativo, entao deve visualizar a `HomeScreen` sem barra de navegacao inferior.

### CA02

Dado que o usuario esta logado, quando acessar a area autenticada, entao deve visualizar a barra de navegacao inferior com tres abas.

### CA03

Dado que o usuario entra na navegacao autenticada, entao a aba inicial exibida deve ser a tela de `Mapa`.

### CA04

Dado que o usuario toca na aba `Empreendimentos`, entao o sistema deve exibir a tela de empreendimentos com o texto descritivo.

### CA05

Dado que o usuario toca na aba `Mapa`, entao o sistema deve exibir a tela de mapa com o texto descritivo.

### CA06

Dado que o usuario toca na aba `Perfil`, entao o sistema deve redireciona-lo para a `HomeScreen`.

## Escopo da entrega

### Inclui

- criacao da barra de navegacao inferior;
- refatoracao do fluxo atual da area autenticada;
- criacao das telas base de mapa e empreendimentos;
- navegacao entre tres abas;
- redirecionamento da aba perfil para `HomeScreen`.

### Nao inclui

- integracao com mapa;
- carregamento de empreendimentos;
- filtros;
- API;
- tela final de perfil do usuario.

## Observacoes tecnicas

A implementacao deve manter separacao clara entre dois fluxos:

### Fluxo nao autenticado

- `HomeScreen`.

### Fluxo autenticado

Navegacao com barra inferior contendo:

- Empreendimentos;
- Mapa;
- Perfil.

Nesta versao, a aba `Perfil` funcionara apenas como redirecionamento para a `HomeScreen`.
