# Camera para foto de perfil

## Titulo

Adicao de funcionalidade de captura de imagem utilizando a camera do dispositivo para definicao de foto de perfil do usuario.

## Objetivo

Implementar a funcionalidade de captura de imagem dentro da tela de perfil do aplicativo Pet House, permitindo que o usuario utilize a camera do dispositivo para definir sua foto de perfil.

A imagem capturada deve ser exibida imediatamente e persistida localmente para que permaneça disponivel mesmo apos o fechamento do aplicativo.

## Contexto

Atualmente o aplicativo possui:

- tela de perfil com exibicao de avatar padrao;
- estrutura de navegacao com acesso a aba de perfil;
- ausencia de funcionalidade para alteracao da foto do usuario.

Este requisito adiciona a capacidade de captura de imagem via camera diretamente na tela de perfil.

## Descricao do requisito

O sistema deve permitir que o usuario:

- toque na imagem de perfil;
- abra a camera do dispositivo;
- capture uma nova foto;
- visualize a imagem capturada como foto de perfil;
- persistir a imagem localmente.

A funcionalidade deve ocorrer dentro da propria tela de perfil, sem navegacao adicional.

## Regras de negocio

### RN01 - Acesso a camera

Ao tocar na imagem de perfil, o sistema deve solicitar permissao de acesso a camera, caso ainda nao tenha sido concedida.

### RN02 - Permissao negada

Caso o usuario negue a permissao, o sistema deve exibir mensagem informando que a funcionalidade depende dessa autorizacao.

### RN03 - Abertura da camera

Quando a permissao for concedida, o sistema deve abrir a camera dentro da tela de perfil.

### RN04 - Captura da imagem

O sistema deve permitir que o usuario capture uma foto utilizando a camera do dispositivo.

### RN05 - Exibicao da imagem

Apos a captura, a imagem deve ser exibida imediatamente como foto de perfil do usuario.

### RN06 - Persistencia local

A URI da imagem capturada deve ser armazenada localmente utilizando AsyncStorage.

### RN07 - Carregamento da imagem

Ao acessar a tela de perfil, o sistema deve verificar se existe uma imagem salva e, caso exista, exibi-la.

### RN08 - Cancelamento da captura

O usuario deve poder cancelar a captura e retornar a tela de perfil sem alterar a imagem atual.

### RN09 - Avatar padrao

Caso nao exista imagem salva, o sistema deve exibir um avatar padrao.

### RN10 - Armazenamento

O sistema deve armazenar apenas a URI da imagem, nao sendo responsavel pelo armazenamento fisico do arquivo.

## Criterios de aceite

### CA01

Dado que o usuario acessa a tela de perfil, quando nao houver imagem salva, entao deve visualizar um avatar padrao.

### CA02

Dado que o usuario toca na imagem de perfil, quando possui permissao, entao a camera deve ser aberta.

### CA03

Dado que o usuario nao concedeu permissao, quando tentar acessar a camera, entao o sistema deve solicitar permissao.

### CA04

Dado que o usuario captura uma foto, entao a imagem deve ser exibida imediatamente.

### CA05

Dado que o usuario captura uma foto, entao a URI da imagem deve ser salva localmente.

### CA06

Dado que o usuario fecha e reabre o aplicativo, entao a imagem deve continuar sendo exibida.

### CA07

Dado que o usuario cancela a captura, entao nenhuma alteracao deve ser realizada.

## Escopo da entrega

### Inclui

- integracao com camera utilizando expo-camera;
- solicitacao de permissao de camera;
- captura de imagem;
- exibicao da imagem na tela de perfil;
- persistencia da imagem utilizando AsyncStorage;
- carregamento da imagem ao iniciar a tela;
- opcao de cancelamento.

### Nao inclui

- upload de imagem para servidor;
- edicao de imagem;
- armazenamento em nuvem;
- sincronizacao entre dispositivos;
- selecao de imagem da galeria;
- exclusao manual da imagem salva.

## Observacoes tecnicas

A implementacao deve utilizar:

- expo-camera para acesso a camera;
- AsyncStorage para persistencia da URI;
- useState para controle de estado;
- useRef para manipulacao da camera;
- useEffect para carregamento inicial da imagem.

A camera deve ser renderizada condicionalmente dentro da tela de perfil.

Fluxo da funcionalidade:

- usuario toca no avatar;
- sistema solicita permissao;
- camera e aberta;
- usuario captura ou cancela;
- se capturar, imagem e salva e exibida;
- se cancelar, retorna sem alteracoes.