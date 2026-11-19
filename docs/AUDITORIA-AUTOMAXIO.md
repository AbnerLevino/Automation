# Auditoria técnica — Automaxio

> Documento de referência interna, produzido para fundamentar o design do Equipment Inspector.
> **Não contém código-fonte do Automaxio.** Serve apenas para registrar o que foi encontrado no
> repositório público (https://github.com/AbnerLevino/Automaxio) em 2026-11-19, separando
> claramente o que está implementado do que é apenas visão de roadmap.

## 1. Organização dos projetos

Solução .NET 10 (`AutomationPlatform`) com 8 projetos: `Contracts`, `Engine`,
`Diagnostics.Printing`, `Platform.Windows`, `Host.Cli`, `Host.Desktop` (WPF), `Host.Elevated`,
`Tests`. 36 commits, autoria única, progressão incremental por fases (A→G) documentada em
`docs/ROADMAP.md`.

## 2. Arquitetura

Clean Architecture / Ports & Adapters. `Diagnostics.Printing` contém as regras de negócio e
depende somente de `Contracts` — nunca do Windows diretamente. `Platform.Windows` implementa as
interfaces (`IPrintDeviceProvider`, `IPrintSystemProvider`) que efetivamente tocam o sistema
operacional via WMI. Fluxo: `Host.Cli` / `Host.Desktop` → `Engine.DiagnosticEngine` (timeout de
30s, cancelamento, nunca engole exceção) → `Diagnostics.Printing` → `Platform.Windows`. Decisão de
design central: regras de negócio testáveis com fakes, sem depender do Windows real.

## 3. Responsabilidade de cada módulo

- **Contracts** — modelos de relatório, `ICheck`, `IDiagnostic`, `IScenario`, `GuidedFlow`,
  `Remediation`, `ElevatedExecutor`.
- **Engine** — registro/execução de diagnósticos, `RemediationPipeline`.
- **Diagnostics.Printing** — checks atômicos (spooler, fila, estado, porta, erro de dispositivo,
  impressora padrão), cenários como `NotPrintingScenario`, `CauseAnalyzer`.
- **Platform.Windows** — consultas WMI somente `SELECT`.
- **Host.Cli** — terminal (`list`/`run`, `--json`).
- **Host.Desktop** — GUI WPF com fluxo guiado.
- **Host.Elevated** — processo separado, lista fixa de ações administrativas via UAC.

## 4. Dependências

Único pacote externo de runtime: `System.Management` (WMI), em `Platform.Windows`. Testes com
xUnit + coverlet. Nenhuma dependência de IA externa ou de rede HTTP.

## 5. Testes

332 `[Fact]`/`[Theory]` locais (roadmap cita até 468 na fase E). Cobrem regras de diagnóstico,
engine, serialização, CLI, fluxo guiado e elevação — todos com providers falsos
(`FakePrintSystemProvider`), sem depender de impressora física.

## 6. Tratamento de erros

Provedores devolvem `SourceResult` (não lançam exceção) para falhas esperadas (sem permissão, WMI
indisponível). `DiagnosticEngine` converte qualquer exceção em relatório com `ExecutionStatus`
apropriado.

## 7. Integração com Windows

Exclusivamente via WMI (`Win32_...`, incluindo `Win32_TCPIPPrinterPort`), sempre leitura
(`SELECT`). Ações de escrita (reiniciar o spooler) passam por `Host.Elevated`, processo separado
com lista fixa de ações permitidas, validação de path/trust do executável, sem armazenar senha
(UAC nativo).

## 8. Segurança

Diagnóstico 100% somente-leitura, não exige admin. Correções exigem confirmação explícita, níveis
N1/N2/N3, auditoria em memória, revalidação pós-ação. `Host.Elevated` não confia no chamador,
revalida tudo. Documentado em `docs/SECURITY.md`, com limitações conhecidas assumidas (relatório
não assinado, executor sem assinatura digital ainda).

## 9. Funcionalidades existentes (implementadas)

- Diagnóstico de impressoras via WMI: spooler, fila, estado, porta (configuração, não teste de
  rede), impressora padrão, erro de dispositivo.
- Cenário "não está imprimindo" com causa provável.
- Pipeline de remediação com 2 ações reais (retomar impressora pausada, reiniciar spooler via
  elevação) + 1 ação local (imprimir página de teste).
- GUI WPF com fluxo guiado por botões; CLI com `list`/`run`/`--json`.

## 10. Funcionalidades apenas documentadas (não implementadas)

- **Drivers**: não há módulo de listagem (nome/fabricante/versão). "Driver" hoje só aparece como
  texto de causa provável no `CauseAnalyzer`, não como consulta real.
- **Rede**: nenhuma implementação — sem consulta de adaptadores, IPv4, MAC, gateway ou DNS, apesar
  de citado como visão futura no README.
- **Integração com o ERP USE**: bloqueada, existe apenas documento de especificação.
- Outras categorias de automação: "pendente" no roadmap.

## 11. Roadmap

Fases A–E concluídas (checks atômicos → cenários → pipeline de ação → interação guiada →
executor elevado). Fase F ("primeiro problema ponta a ponta") pendente. Fase G (GUI WPF) em
andamento. Integração USE bloqueada por decisão de negócio ainda não tomada.

## 12. Conclusão relevante para o Equipment Inspector

O Automaxio real é mais modesto que a visão do README: cobre só diagnóstico (e duas ações de
correção) de impressoras. **Não existe hoje nenhuma implementação de drivers ou rede** — logo,
nenhum desses módulos do Equipment Inspector pode ou precisa ser "baseado" em código existente do
Automaxio; serão implementações genuinamente novas e independentes.

A diferença mais importante entre os dois projetos não é de escopo (impressoras vs. impressoras +
drivers + rede + computador), mas de **classe de risco**: o Automaxio tem poder de ação
(remediação real, execução elevada via UAC); o Equipment Inspector é estruturalmente incapaz de
agir — só lê e apresenta. Essa é a diferença que deve ficar explícita na especificação como
requisito não funcional central, não apenas como observação de escopo.
