# Equipment Inspector

Ferramenta de consulta (somente leitura) sobre impressoras, drivers, computador e rede em
máquinas Windows, feita para apoiar o suporte técnico de equipamentos da Data System.

É um projeto independente — não reutiliza nem depende da implementação do
[Automaxio](https://github.com/AbnerLevino/Automaxio). Veja `docs/AUDITORIA-AUTOMAXIO.md` e
`docs/ESPECIFICACAO.md` para o contexto completo das decisões de design.

## O que esta ferramenta NUNCA faz

- Instalar, atualizar ou remover drivers.
- Reiniciar serviços.
- Alterar registro, rede ou configuração de impressoras.
- Executar qualquer comando administrativo de alteração.

Todas as consultas usam apenas cmdlets de leitura do PowerShell (`Get-*`). A lista de consultas é
fechada e fixa no código (`src/services/powershell.js`) — nada é montado a partir de entrada do
usuário. Isso é verificado automaticamente em `tests/powershell.test.js`.

## Requisitos

- Windows 10/11.
- Node.js 18 ou superior.
- Microsoft Edge instalado (padrão em qualquer Windows atual) — usado para abrir a janela da
  aplicação em modo app.

## Instalação

```bash
npm install
```

Este projeto não usa nenhuma dependência externa de runtime.

## Execução

```bash
npm start
```

Isso inicia um servidor local e abre a janela do Equipment Inspector automaticamente. Se o Edge
não for encontrado no caminho padrão, o terminal mostra o endereço
(`http://127.0.0.1:4321`) para abrir manualmente.

## Testes

```bash
npm test
```

Os testes cobrem a interpretação e formatação dos dados retornados pelo PowerShell, usando dados
simulados — não dependem de uma máquina Windows real para rodar.

## Funcionalidades

- **Impressoras**: nome, status informado pelo Windows, porta, se é padrão/compartilhada.
- **Drivers**: nome, fabricante, versão, ambiente.
- **Computador**: nome, sistema operacional, versão, arquitetura, fabricante/modelo, RAM, tempo
  ativo.
- **Rede**: adaptadores, endereço MAC, status, IPv4, gateway, servidores DNS.
- **Visão geral**: consulta os quatro módulos de uma vez.
- **Exportar JSON**: salva a última consulta geral em `reports/`.

## Limitações conhecidas

- Algumas informações podem não estar disponíveis dependendo da versão do Windows, dos drivers
  instalados, de permissões ou do estado dos equipamentos. Quando isso ocorre, o campo aparece
  como "não disponível" — a ferramenta nunca inventa um valor.
- `Get-ComputerInfo` pode demorar alguns segundos em certas máquinas; o timeout dessa consulta é
  maior que o das demais (20s, contra 10s do padrão).
- A janela depende do Microsoft Edge estar instalado; não há suporte a outro navegador nesta
  versão.
- Desenvolvido e testado automaticamente fora do Windows; a validação final em máquina Windows
  real do ambiente de suporte ainda precisa ser feita manualmente.
