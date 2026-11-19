# Equipment Inspector — Especificação

## 1. Propósito

Ferramenta de terminal, em Node.js/JavaScript, para auxiliar o suporte de equipamentos da Data
System consultando informações técnicas sobre impressoras, drivers, computador e rede em máquinas
Windows. É um projeto independente do Automaxio (ver [AUDITORIA-AUTOMAXIO.md](AUDITORIA-AUTOMAXIO.md)):
não reutiliza, referencia ou depende de sua implementação.

## 2. Requisito não funcional central: classe de risco

Esta é a diferença fundamental de design em relação ao Automaxio, e não uma limitação temporária:

> **O Equipment Inspector é estruturalmente incapaz de executar qualquer ação de escrita no
> sistema.** Ele só lê e apresenta. Não existe, em nenhuma camada do código, um caminho para
> instalar, atualizar ou remover drivers; reiniciar serviços; alterar registro, rede ou
> configuração de impressoras; ou executar qualquer comando administrativo de alteração.

Na prática isso significa:
- Toda consulta ao Windows usa apenas cmdlets/consultas de **leitura** do PowerShell
  (`Get-*`, nunca `Set-*`, `Remove-*`, `New-*`, `Restart-*`, `Install-*`).
- Não há lista de "ações permitidas" nem camada de elevação — porque não existe ação nenhuma.
- Não são aceitos comandos arbitrários vindos de entrada do usuário; cada consulta é uma função
  fixa e pré-definida no código, nunca uma string montada a partir de input livre.

## 3. Requisitos funcionais

### Módulo A — Impressoras
- Listar impressoras instaladas.
- Nome, fabricante/modelo (quando disponível), impressora padrão, status informado pelo Windows,
  porta associada, tipo de conexão (local/compartilhada/rede).

### Módulo B — Drivers
- Listar drivers de impressão instalados: nome, fabricante, versão e data (quando disponíveis).
- Associar driver → impressora(s) que o utilizam.
- Indicar explicitamente quando um campo não pôde ser determinado.

### Módulo C — Computador
- Nome do computador, sistema operacional e versão, arquitetura, modelo (quando disponível),
  processador, memória RAM instalada, tempo de atividade.

### Módulo D — Rede
- Adaptadores de rede, IPv4, MAC, gateway padrão, servidores DNS configurados.
- Associação de IP a impressoras de rede, quando identificável a partir da porta/configuração já
  consultada (sem testes ativos de conectividade).

### Módulo E — Consulta geral
- Opção de menu que executa os módulos A–D em sequência e apresenta um resumo único (útil para
  abertura de chamado).

## 4. Requisitos não funcionais (qualidade)

- Nenhuma consulta exige privilégio administrativo, salvo quando o próprio Windows exigir para
  aquela informação específica — e nesse caso a ausência de permissão é reportada como limitação,
  nunca contornada.
- Timeout em toda chamada PowerShell, com mensagem clara de indisponibilidade.
- Nunca travar o menu por uma consulta que falhe ou demore.
- Nenhuma informação é inventada: campo não obtido = "não disponível", nunca um valor presumido.
- Não armazenar credenciais; não coletar dados pessoais além do necessário para suporte técnico
  (ex.: nome do computador, não o do usuário logado).
- Código organizado por responsabilidade, funções pequenas, sem abstrações além do necessário.
- Testes cobrindo as funções de parsing/formatação dos dados retornados pelo PowerShell (podem
  rodar em qualquer SO, usando saídas simuladas — sem depender de uma máquina Windows real).

## 5. Fora de escopo (explicitamente)

Instalar/atualizar/remover drivers · reiniciar serviços · alterar registro · alterar configuração
de rede ou impressoras · executar manutenção automática · qualquer comando administrativo de
alteração · IA/automação de correções · interface gráfica ou servidor web (nesta primeira versão).

## 6. Arquitetura de diretórios

```
equipment-inspector/
├── src/
│   ├── index.js              # ponto de entrada, inicia o menu
│   ├── modules/
│   │   ├── printers.js       # Módulo A
│   │   ├── drivers.js        # Módulo B
│   │   ├── computer.js       # Módulo C
│   │   └── network.js        # Módulo D
│   ├── services/
│   │   └── powershell.js     # execução controlada de comandos PowerShell fixos, com timeout
│   ├── utils/
│   │   └── formatter.js      # formatação de saída para terminal / JSON
│   └── menu/
│       └── main-menu.js      # menu interativo (Módulo E agrega A–D)
├── tests/
├── reports/                  # exports JSON opcionais, gerados em runtime (git-ignored)
├── package.json
├── README.md
└── .gitignore
```

### Responsabilidades e dependências

- `services/powershell.js`: única camada que sabe executar processos externos. Expõe uma função
  por consulta conhecida (ex.: `getPrinters()`, `getNetworkAdapters()`), cada uma com um comando
  PowerShell **fixo e somente-leitura** embutido no código (nunca concatenado com input do
  usuário), timeout configurável e tratamento de erro/indisponibilidade.
- `modules/*.js`: chamam `services/powershell.js`, interpretam o JSON retornado pelo PowerShell e
  devolvem objetos já normalizados (com campos ausentes marcados explicitamente). Não sabem nada
  sobre terminal ou menu.
- `utils/formatter.js`: transforma os objetos normalizados em texto legível para o terminal ou em
  JSON para exportação. Não faz nenhuma chamada ao sistema.
- `menu/main-menu.js`: interface de terminal, orquestra os módulos, não contém lógica de negócio.
- `index.js`: bootstrap.

Dependências externas previstas: nenhuma biblioteca além de, no máximo, uma lib leve de prompt de
terminal (a avaliar se `readline` nativo do Node já é suficiente — preferência por não adicionar
dependência). Node.js LTS, PowerShell (nativo do Windows) para as consultas, JSON como formato
interno.

## 7. Interface — janela local (decisão final)

Decisão tomada após avaliar a necessidade de consistência visual com o que já foi apresentado:
em vez de um CLI de terminal puro, o Equipment Inspector roda um servidor HTTP local (módulo
nativo `http`, sem framework) e abre o navegador padrão (Edge) em modo `--app`, que remove a
barra de endereço e dá aparência de janela de aplicativo nativo — sem a dependência pesada de
Electron.

### 7.1 Chrome da janela (reaproveitado do mecanismo visual já em uso, com identidade própria)

- Janela ~560×720 (mín. 420×520), fonte Segoe UI 14px, fundo `#F3F4F6`.
- Cabeçalho fixo escuro `#1F2937`: título "Equipment Inspector" (18px, semibold, branco) +
  subtítulo (12px, `#D1D5DB`): *"Ferramenta de consulta. Mostro exatamente o que o Windows
  informa — não altero nada no seu sistema."*
- Área central rolável, mensagens ancoradas embaixo (a mais nova empurra as anteriores pra cima).
- Painel inferior colapsável (branco, borda superior `#E5E7EB`, altura máx. 300px) que aparece
  quando uma consulta é disparada, mostrando os cartões de resultado do módulo.
- Rodapé fixo (branco, borda superior) com **um botão por módulo**: Impressoras, Drivers,
  Computador, Rede, Visão geral.

### 7.2 Mecanismo de conversa (motor genérico, sem lógica de negócio)

Reaproduz o comportamento de "assistente conversacional" já validado visualmente, mas o motor em
si não conhece impressora/driver/rede — só desenha o que a camada de conteúdo (módulos) manda:

- Bolha "digitando" (3 pontos em onda) antes de cada fala do "computador".
- Pausa de "pensar" proporcional ao tamanho do texto (com teto), antes do texto aparecer.
- Texto revelado palavra por palavra, respiro maior após pontuação.
- Entrada de cada bolha com fade + leve subida.
- Mensagens anteriores escurecem (opacidade ~0.5) quando chega uma nova; só as últimas 4 ficam
  visíveis.
- Scroll suave até o fim.
- Respeita `prefers-reduced-motion` (equivalente web da opção "reduzir animações" do Windows).
- Cartão de resultado com borda colorida à esquerda — **sem rótulo de "problema"/"ok"**: a cor
  aqui só indica disponibilidade da informação (ex.: cinza = não disponível), nunca um juízo de
  diagnóstico, já que o Inspector não interpreta causas.
- Bolhas: branca (`#FFFFFF`, borda `#E5E7EB`) para o "computador", azul (`#2563EB`) para a
  seleção do usuário.

### 7.3 O que fica explicitamente fora (diferente do que inspirou o mecanismo)

- Sem fluxo de causa, ação candidata, confirmação ou execução — não há nada a confirmar.
- Sem tela de avaliação de atendimento (estrelas/comentário) — fora de escopo por decisão
  explícita.
- Um botão por módulo no rodapé, não um único botão de cenário.

## 8. Plano de implementação (fases restantes)

1. `src/services/powershell.js` — execução controlada, guarda de SO, timeout.
2. Módulo A (impressoras) + testes de parsing com fixture.
3. Módulos B (drivers), C (computador), D (rede), mesmo padrão.
4. `src/utils/formatter.js` — normalização para consumo da UI.
5. `src/server.js` — servidor HTTP nativo, um endpoint por módulo, sem lógica de negócio.
6. `src/ui/` — HTML/CSS/JS do motor de conversa (chrome + mecanismo da seção 7) e do roteiro de
   conteúdo de cada módulo; abertura via `msedge.exe --app=http://localhost:PORTA`.
7. Export JSON opcional em `reports/`.
8. README com instalação, execução, limitações conhecidas por versão do Windows/driver/permissão.
9. Revisão final de escopo: confirmar que nenhuma função do código executa `Set-*`, `Remove-*`,
   `New-*`, `Restart-*`, `Install-*` ou equivalente, e que nenhuma string de comando é montada a
   partir de entrada do usuário.
