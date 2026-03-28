# Pet House

Aplicativo React Native para ajudar tutores de pets a encontrar serviços próximos com base na localização em tempo real.

## Descrição do Projeto

O **Pet House** tem como objetivo facilitar a rotina de tutores, permitindo localizar rapidamente estabelecimentos essenciais para cuidados com animais, como clínicas veterinárias, hotéis para pets e pet shops. O app utiliza a localização do usuário para exibir resultados próximos tanto no mapa quanto em lista.

## Funcionalidades Principais

### 1. Localização do usuário
- O aplicativo utiliza o GPS do celular para detectar a posição do usuário.
- Tecnologias possíveis:
  - Expo Location
  - Google Maps API

### 2. Mapa com locais próximos
- Exibição de estabelecimentos próximos no mapa.
- Tipos de locais:
  - Veterinárias
  - Hotéis para pets
  - Pet shops
- Tecnologias possíveis:
  - Google Maps API
  - Mapbox
  - Expo Maps

### 3. Lista de locais próximos
- Além do mapa, o aplicativo mostra uma lista de estabelecimentos próximos.
- Cada item apresenta:
  - Nome
  - Avaliação
  - Distância
  - Telefone

### 4. Página de detalhes do local
- Ao selecionar um estabelecimento, o usuário acessa uma página com:
  - Nome
  - Telefone
  - Endereço
  - Horário de funcionamento
  - Avaliações
  - Botão para traçar rota

### 5. Integração de rota
- O usuário pode abrir a navegação no:
  - Google Maps
  - Waze

### 6. Filtros de busca
- O usuário pode filtrar os estabelecimentos por:
  - Veterinário
  - Hotel para cães
  - Pet shop
  - Aberto agora
  - 24h

## Roadmap do Projeto

### Etapa 1 - Definição do projeto 07/03/2026
- [x] Criação do grupo
- [x] Escolha do tema do projeto
- [x] Criação do repositório

### Etapa 2 - Autenticação 14/03/2026
- [x] Aula sobre autenticação
- [x] Implementação do login
- [x] Refatoração da TelaSegura para `src/features/auth/screens/SecureScreen.js`
- [x] Criação de estilos globais em `src/shared/styles/app.styles.js`
- [x] Atualização dos ícones da aplicação para `assets/icon-pet-house.png`
- [x] Implementação do logout `src/features/auth/screens/SecureScreen.js` e `/App.js`
- [x] Refatoração tela inicial `src/features/auth/screens/HomeScreen.js`

### Etapa 3 - Próxima entrega 21/03/2026
- [x] Adicao de barra de navegacao inferior `src/features/tabs/navigation/TabNavigator.js`
- [x] Refatoracao de navegacao da area autenticada `src/features/auth/screens/SecureScreen.js`
- [x] Adição Formulário de Login `src/features/auth/screens/HomeScreen.js`
- [x] Adição Checkbox Ativar Biometria `src/features/auth/screens/HomeScreen.js`

### Etapa 4 - Próxima entrega 28/03/2026
- [x] Adição do mapa `src/features/tabs/screens/Map.js`
- [x] Adição dos empreendimentos no mapa `src/features/tabs/screens/Map.js`
- [x] Refatoracao na area de mapa `src/features/tabs/screens/Map.js` e `src/features/shared/styles/mapStyles.js`
- [x] Refatoração de organização de código
- [x] Utilização da câmera no app `src/features/tabs/screens/Profile.js`
- [x] Adicionar armazenamento de imagem usando AsyncStorage `src/features/tabs/screens/Profile.js`
- [x] Adicionar Listagem de Empreendimentos na tela inicial(Home) `src/features/tabs/screens/Home.js`
- [x] Adição Campo de Busca de empreendimentos e reload manual(pull to refresh)  `src/features/tabs/screens/Home.js`

### Etapa 5 - Entrega P1 11/04/2026
- [ ] `Pedro` Ajustar bugs IOS
- [x] `JP` Ajustar tab navigator
- [ ] `Julio` Alterar nome do carregamento para Pet House e garantir carregamento do ícone 
- [ ] `Julio` Carregar tela de início ao abrir o app
- [ ] `Julio` Trocar disposição da tela de início para o meio e mapa para esquerda
- [ ] `Pedro` Verificar código de chamada para API (duplicidade)
- [x] `JP` Adicionar scrolling na tela de início
- [ ] `JP` Adicionar indicador de foto na imagem de perfil, ícone de câmera pequeno
- [ ] `Pedro` Pegar localização exata do usuário com gps e abrir no local do mapa correto

## Documentacao

- [Workflow do projeto](./docs/workflow.md)
- [Indice da documentacao](./docs/README.md)
- [Documentacao de features](./docs/features/README.md)
- [Feature: barra de navegacao inferior](./docs/features/bottom-navigation.md)

## Integrantes

| Nome | Matrícula | GitHub |
|---|---|---|
| [João Pedro Coelho Cadinelli dos Santos](https://github.com/jpcadinelli) | 202313598 | [@jpcadinelli](https://github.com/jpcadinelli) |
| [Julio Fernando Martins Leite](https://github.com/devjuliomartins) | 202310535 | [@devjuliomartins](https://github.com/devjuliomartins) |
| [Pedro Henrique Guimarães Pavanello](https://github.com/devpedropavanello) | 202310824 | [@devpedropavanello](https://github.com/devpedropavanello) |
