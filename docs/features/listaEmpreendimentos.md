# Lista de empreendimentos pet com busca e atualizacao

## Titulo

Exibicao automatica de empreendimentos pet proximos na tela inicial, com suporte a busca por nome e atualizacao manual via gesto de rolagem (pull to refresh).

## Objetivo

Implementar na tela inicial do aplicativo Pet House uma lista de estabelecimentos pet proximos ao usuario, carregada automaticamente ao acessar a tela.

A lista deve permitir:

- visualizacao de nome, distancia e status do estabelecimento;
- atualizacao manual dos dados por meio do gesto de puxar para baixo;
- filtragem em tempo real atraves de um campo de busca no topo da tela.

## Contexto

Atualmente o aplicativo possui:

- integracao com API do OpenStreetMap (Overpass) para busca de locais pet;
- tela de mapa exibindo marcadores dos estabelecimentos;
- ausencia de listagem estruturada na tela inicial;
- ausencia de mecanismo de busca e atualizacao manual.

Este requisito adiciona uma interface de listagem com foco em usabilidade e experiencia do usuario.

## Descricao do requisito

O sistema deve:

- carregar automaticamente os empreendimentos pet ao abrir a tela inicial;
- exibir os dados em formato de lista com layout em cards;
- apresentar para cada item:
  - imagem ilustrativa;
  - nome do estabelecimento;
  - distancia em relacao ao usuario;
  - status (aberto, fechado ou 24h);
- permitir atualizacao manual por gesto de rolagem (pull to refresh);
- permitir filtragem dos resultados por meio de campo de busca no topo.

A funcionalidade deve ocorrer diretamente na tela inicial, sem necessidade de navegacao adicional.

## Regras de negocio

### RN01 - Carregamento automatico

Ao acessar a tela inicial, o sistema deve buscar automaticamente os empreendimentos pet proximos.

### RN02 - Exibicao dos dados

Cada item da lista deve exibir nome, distancia e status do estabelecimento.

### RN03 - Atualizacao manual

O usuario deve poder atualizar a lista utilizando o gesto de puxar para baixo.

### RN04 - Filtro por nome

O sistema deve permitir a filtragem dos resultados com base no texto digitado no campo de busca.

### RN05 - Lista vazia

Caso nao existam resultados, o sistema deve informar que nenhum estabelecimento foi encontrado.

### RN06 - Estado de carregamento

Durante a busca dos dados, o sistema deve exibir um indicador de carregamento.

## Criterios de aceite

### CA01

Dado que o usuario acessa a tela inicial, entao a lista deve ser carregada automaticamente.

### CA02

Dado que existem estabelecimentos proximos, entao eles devem ser exibidos na lista.

### CA03

Dado que o usuario realiza o gesto de puxar para baixo, entao a lista deve ser atualizada.

### CA04

Dado que o usuario digita no campo de busca, entao a lista deve ser filtrada em tempo real.

### CA05

Dado que nao existem resultados, entao o sistema deve exibir uma mensagem informativa.

### CA06

Dado que o sistema esta carregando os dados, entao deve ser exibido um indicador de loading.

## Escopo da entrega

### Inclui

- listagem de empreendimentos pet;
- integracao com API Overpass;
- exibicao em formato de cards;
- campo de busca;
- funcionalidade de pull to refresh;
- calculo de distancia;
- exibicao de status (simulado).

### Nao inclui

- integracao com API de horarios reais;
- imagens reais dos estabelecimentos;
- sistema de favoritos;
- ordenacao avancada;
- filtros por categoria;
- geolocalizacao em tempo real do usuario.

## Observacoes tecnicas

A implementacao deve utilizar:

- React Native;
- FlatList para renderizacao da lista;
- ActivityIndicator para loading;
- useState para controle de estado;
- useEffect para carregamento inicial;
- RefreshControl para atualizacao manual;
- consumo da API Overpass.

Fluxo da funcionalidade:

- usuario acessa a tela inicial;
- sistema realiza a busca dos estabelecimentos;
- lista e exibida na tela;
- usuario pode buscar por nome;
- usuario pode atualizar a lista com pull to refresh;