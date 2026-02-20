# Nova Arquitetura do GenIA E2E Test Generator

---

## Sumário:

1. [Visão Geral da Transformação](#1-visão-geral-da-transformação)
2. [Representação Visual do Novo Fluxo (Grafo)](#2-representação-visual-do-novo-fluxo-grafo)
3. [Estrutura de Diretórios da Nova Arquitetura](#3-estrutura-de-diretórios-da-nova-arquitetura)
4. [Ponto de Entrada: De `asyncio.run(main())` para `main.py`](#4-ponto-de-entrada-de-asynciorunmain-para-mainpy)
5. [Configuração de Ambiente: De variáveis soltas para `src/env/`](#5-configuração-de-ambiente-de-variáveis-soltas-para-srcenv)
6. [Modelos de Dados: De classes inline para `src/models/`](#6-modelos-de-dados-de-classes-inline-para-srcmodels)
7. [Prompts: De strings embutidas para templates Jinja2 (`src/prompts/`)](#7-prompts-de-strings-embutidas-para-templates-jinja2-srcprompts)
8. [Ferramentas Utilitárias: `src/tools/`](#8-ferramentas-utilitárias-srctools)
9. [Utilitários Compartilhados: `src/utils/`](#9-utilitários-compartilhados-srcutils)
10. [O Coração da Nova Arquitetura: O Grafo LangGraph (`src/graph/`)](#10-o-coração-da-nova-arquitetura-o-grafo-langgraph-srcgraph)
11. [Estado Compartilhado: `GenIAState`](#11-estado-compartilhado-geniastate)
12. [Agentes (Agents): `src/graph/agents/`](#12-agentes-agents-srcgraphagents)
13. [Nós (Nodes): `src/graph/nodes/`](#13-nós-nodes-srcgraphnodes)
14. [Arestas Condicionais (Edges): `src/graph/edges/`](#14-arestas-condicionais-edges-srcgraphedges)
15. [Mapas de Roteamento: `routing_maps.py`](#15-mapas-de-roteamento-routing_mapspy)
16. [Orquestrador: `orchestrator.py`](#16-orquestrador-orchestratorpy)
17. [O que Mudou na Nova Arquitetura](#17-o-que-mudou-na-nova-arquitetura)

---

## 1. Visão Geral da Transformação:

### O que era o script original (`genIAE2ETest.py`):

O script original era um **arquivo monolítico** que executava três etapas sequenciais em um único arquivo:

1. **Reestruturação (Level 1):** Pegava o caso de teste em texto puro e, via chamada à API da OpenAI com Structured Output, gerava um JSON estruturado dividindo o caso de teste em módulos por URL.
2. **Extração + Refinamento (Level 2):** Para cada módulo/URL, usava o `crawl4ai` para visitar a página, extrair elementos HTML relevantes (primeira passada) e em seguida refinar esses elementos (segunda passada).
3. **Geração de Script (Level 3):** Usava a API da OpenAI para gerar um script Robot Framework a partir dos dados refinados.

Tudo isso vivia em um único `async def main()` com loops aninhados, prompts hardcoded como f-strings gigantes, modelos Pydantic definidos no mesmo arquivo, e lógica de I/O, parsing e chamadas LLM completamente entrelaçados.

### O que é a nova arquitetura:

A nova arquitetura preserva **exatamente as mesmas 3 fases de processamento**, mas as organiza como um **grafo de estados (state graph)** usando o framework **LangGraph**. Cada fase é implementada como um **nó** do grafo, a lógica de LLM vive em **agentes** dedicados, as transições entre fases são gerenciadas por **arestas condicionais**, e todo o restante, como os modelos, prompts, ferramentas e configurações estão isolados em módulos bem independentes e totalmente reutilizáveis.

<div align=center>
  <img width="50%" height="4610" alt="mapping" src="https://github.com/user-attachments/assets/ceb51690-2332-4fbc-a689-20d77f4cfa37" />
</div>

---

## 2. Representação Visual do Novo Fluxo (Grafo):

**O diagrama abaixo representa o fluxo completo do grafo LangGraph compilado.** Ele é gerado automaticamente pelo método `visualize_workflow()` do orquestrador e salvo como `workflow.png` na pasta de saída.

<div align=center>
  <img width="50%" height="4150" alt="graph" src="https://github.com/user-attachments/assets/3d6b27d1-0247-4b1c-b7b7-75f2d3ba4cd3" />
</div>

<br>

**Ciclo de módulos:** Após refinar cada módulo, o grafo verifica se ainda existem módulos pendentes. Se sim, retorna ao nó `EXPLORING_TASK` para processar o próximo módulo. Ao finalizar todos os módulos, avança para `CODING_TASK`.

---

## 3. Estrutura de Diretórios da Nova Arquitetura:

```
src/
├── __init__.py                     # Pacote raiz
├── env/                            # Configuração de ambiente
│   ├── __init__.py
│   └── index.py                    # EnvironmentVariables (dataclass tipada)
├── graph/                          # Grafo LangGraph (coração da aplicação)
│   ├── __init__.py
│   ├── orchestrator.py             # GenIAStateOrchestrator (compila e executa o grafo)
│   ├── routing_maps.py             # Mapas estáticos de roteamento
│   ├── state.py                    # GenIAState (TypedDict do estado compartilhado)
│   ├── agents/                     # Funções que encapsulam chamadas à LLM
│   │   ├── __init__.py
│   │   ├── coder.py                # Agente de geração de código Robot Framework
│   │   ├── explorer.py             # Agente de extração de elementos HTML
│   │   ├── refiner.py              # Agente de refinamento de elementos
│   │   └── test_refactor.py        # Agente de reestruturação do caso de teste
│   ├── edges/                      # Funções de roteamento condicional entre nós
│   │   ├── __init__.py
│   │   ├── route_after_extraction.py
│   │   ├── route_after_refinement.py
│   │   └── route_after_restructuring.py
│   └── nodes/                      # Funções de nó do grafo (lógica de cada fase)
│       ├── __init__.py
│       ├── extraction.py           # Nó de extração (Level 2, Pass 1)
│       ├── generation.py           # Nó de geração (Level 3)
│       ├── refinement.py           # Nó de refinamento (Level 2, Pass 2)
│       └── restructuring.py        # Nó de reestruturação (Level 1)
├── models/                         # Modelos Pydantic tipados
│   ├── __init__.py
│   ├── dispatcher_stats.py         # DispatcherStatsModel, métricas de performance do crawler (memória, tempo)
│   ├── execution_step.py           # ExecutionStepModel, um passo de ação do usuário com seus elementos HTML
│   ├── extracted_element.py        # ExtractedElement, elemento HTML identificado na página (tipo, XPath, descrição)
│   ├── extracted_module_model.py   # ExtractedModuleModel, módulo + metadados de extração (herda ModuleModel)
│   ├── extracted_test_case_model.py# ExtractedTestCaseModel, caso de teste com módulos enriquecidos (herda TestCaseModel)
│   ├── extraction_container.py     # ExtractionContainer, wrapper que agrupa a lista de elementos retornada pelo crawl4ai
│   ├── extraction_result.py        # ExtractionResultModel, resultado completo de uma passada: elementos + tokens + stats
│   ├── module.py                   # ModuleModel, agrupamento de passos por URL (uma página do teste)
│   ├── test_case.py                # TestCaseModel, caso de teste completo com nome e lista de módulos
│   └── token_usage.py              # TokenUsageModel, consumo de tokens da LLM (prompt, completion, total)
├── prompts/                        # Templates Jinja2 para prompts de LLM
│   ├── level1_restructuring.j2     # Prompt de reestruturação
│   ├── level2_extraction.j2        # Prompt de extração
│   ├── level2_refinement.j2        # Prompt de refinamento
│   └── level3_generation.j2        # Prompt de geração de código
├── tools/                          # Ferramentas/utilitários de infraestrutura
│   ├── __init__.py
│   ├── browser.py                  # BrowserManager (singleton) + BrowserTool
│   ├── file_system.py              # Leitura/escrita de arquivos e JSON
│   ├── gen_ia_client.py            # GenIAClientProvider (singleton OpenAI)
│   ├── load_prompt.py              # Carregador de templates Jinja2
│   └── parser.py                   # strip_markdown_code_fences + map_extracted_data_to_steps
└── utils/                          # Utilitários transversais
    ├── __init__.py
    ├── enums.py                    # GenIANodeName + GenIAStateStatus (StrEnum)
    └── logger.py                   # Sistema de logging hierárquico
```

---

## 4. Ponto de Entrada: De `asyncio.run(main())` para `main.py`:

### No script original:

Tudo acontecia dentro de uma única função `main()` de centenas de linhas:

```python
# genIAE2ETest.py (script original)
async def main():
    create_directory_if_not_exists(newFolder)
    async with AsyncWebCrawler() as crawler:
        for arquivo in exampleFolder.iterdir():
            # ... ~350 linhas de lógica entrelaçada ...
```

A função `main()` era responsável por **tudo**: ler arquivos, instanciar o crawler, iterar sobre casos de teste, chamar a API da OpenAI, iterar sobre módulos, fazer extração e refinamento via crawl4ai, salvar arquivos JSON e gerar scripts Robot Framework.

### Na nova arquitetura:

O `main.py` na raiz do projeto tem apenas **~40 linhas** e é extremamente enxuto:

```python
# main.py (nova arquitetura)
async def process_test_cases(input_dir, output_dir, num_attempts=1):
    orchestrator = GenIAStateOrchestrator(output_dir)
    for test_file in input_dir.iterdir():
        test_case_content = read_file(test_file)
        for attempt in range(1, num_attempts + 1):
            final_state = await orchestrator.run(test_case_content, test_file.stem, attempt)

async def main():
    input_dir = env_variables.test_cases_examples_folder
    output_dir = env_variables.test_cases_output_folder
    await process_test_cases(input_dir, output_dir, num_attempts=3)
```

**O que mudou:**
- O `main.py` agora **apenas** itera sobre os arquivos de entrada e delega toda a lógica ao `GenIAStateOrchestrator`.
- Toda a orquestração é feita pelo grafo LangGraph compilado.

---

## 5. Configuração de Ambiente: De variáveis soltas para `src/env/`:

### No script original:

As variáveis de ambiente eram carregadas de forma desestruturada no escopo global do script:

```python
# genIAE2ETest.py (script original)
load_dotenv()
test_case_file = os.getenv("TEST_CASE")
api_key_string = os.getenv("OPENAI_API_KEY")
exampleFolder = Path('TestCaseExamples')
newFolder = Path('TestCases')
```

Sem validação, sem tipagem, sem centralização. Se `OPENAI_API_KEY` estivesse ausente, o erro só apareceria no meio da execução.

### Na nova arquitetura → `src/env/index.py`:

Agora existe uma **dataclass tipada** `EnvironmentVariables` que centraliza e valida todas as configurações:

```python
# src/env/index.py
@dataclass
class EnvironmentVariables:
    api_key_string: str                          # Obrigatória, caso contrário ocorrerá um erro explícito se ausente
    prompts_dir: Path = PROJECT_ROOT / "src" / "prompts"
    test_cases_examples_folder: Path = PROJECT_ROOT / "TestCaseExamples"
    test_cases_output_folder: Path = PROJECT_ROOT / "TestCases"
    ai_agent_model: ChatModel = "gpt-4o-mini"
    ai_agents_temperature: float = 0.0
    ai_agents_responses_quantity: int = 1
```

**O que mudou:**
- `MissingConfigurationError` é lançado imediatamente se a chave da API não estiver definida.
- Todos os caminhos de diretórios, o modelo da LLM, a temperatura e a quantidade de respostas estão centralizados em um único lugar.
- A instância `env_variables` é criada **uma vez** na importação e reutilizada em toda a aplicação via `from src.env import env_variables`.

---

## 6. Modelos de Dados: De classes inline para `src/models/`:

### No script original:

Os modelos Pydantic estavam todos definidos como classes globais no meio do script:

```python
# genIAE2ETest.py (script original), tudo no mesmo arquivo
class ExtractedElement(BaseModel):
    type: str = Field(...)
    request_description: str = Field(...)
    identifier_type: str = Field(...)
    identifier_tracking: str = Field(...)
    step_name: str = Field(...)

class ExecutionStepModel(BaseModel):
    step: str = Field(...)
    extracted_data: List[ExtractedElement] = Field(...)

class ModuleModel(BaseModel):
    url: str = Field(...)
    purpose: str = Field(...)
    execution_steps: List[ExecutionStepModel] = Field(...)

class TestCaseModel(BaseModel):
    testCase: str = Field(...)
    modules: List[ModuleModel] = Field(...)
```

Eram apenas **4 modelos** que serviam para tudo, tanto para a reestruturação quanto para a extração e saída. Dados de token e dispatcher eram armazenados como dicionários avulsos injetados manualmente nos JSON.

### Na nova arquitetura → `src/models/`:

Cada modelo agora vive em seu **próprio arquivo**, com documentação e tipagem completa. Além disso, foram criados **modelos adicionais** para cobrir dados que antes eram dicionários não tipados:

<div align="center">

| Arquivo | Modelo | Descrição | Equivalente no script original |
|---------|--------|-----------|--------------------------|
| `extracted_element.py` | `ExtractedElement` | Elemento HTML extraído (type, xpath, step_name…) | `ExtractedElement` (mesmo nome, mas agora isolado) |
| `execution_step.py` | `ExecutionStepModel` | Passo de execução com lista de elementos | `ExecutionStepModel` (mesmo) |
| `module.py` | `ModuleModel` | Módulo com URL, propósito e passos | `ModuleModel` (mesmo) |
| `test_case.py` | `TestCaseModel` | Caso de teste com lista de módulos | `TestCaseModel` (mesmo) |
| `token_usage.py` | `TokenUsageModel` | Estatísticas de consumo de tokens | **Novo**, antes era um `dict` montado manualmente |
| `dispatcher_stats.py` | `DispatcherStatsModel` | Métricas de performance do dispatcher | **Novo**, antes era um `dict` montado manualmente |
| `extracted_module_model.py` | `ExtractedModuleModel` | `ModuleModel` + metadados de extração (token, dispatcher) | **Novo**, antes os dados eram injetados com `module["token"] = ...` |
| `extracted_test_case_model.py` | `ExtractedTestCaseModel` | `TestCaseModel` com módulos enriquecidos | **Novo**, antes era um `dict` JSON manipulado |
| `extraction_container.py` | `ExtractionContainer` | Wrapper para lista de elementos extraídos | **Novo**, encapsula a resposta do crawl4ai |
| `extraction_result.py` | `ExtractionResultModel` | Resultado completo de uma extração (conteúdo + tokens + dispatcher) | **Novo**, antes tudo era manipulado in-place |

</div>

### Descrição Detalhada de Cada Modelo:

#### `ExtractedElement`:
Representa um **único elemento HTML** identificado na página durante a fase de extração.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | `str` | Tipo do elemento HTML: `'input'`, `'button'`, `'select'`, etc. |
| `request_description` | `str` | Descrição do que o elemento pede ao usuário. Ex: `"Enter your First Name"` |
| `identifier_type` | `str` | Método de localização: preferencialmente `"XPath"`, mas pode ser ID, name, etc. |
| `identifier_tracking` | `str` | Caminho exato (XPath ou outra referência) para localizar o elemento |
| `step_name` | `str` | Nome do passo de execução que utiliza este elemento |

</div>

#### `ExecutionStepModel`:
Representa um **passo de execução** dentro de um módulo, uma ação do usuário ou verificação.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `step` | `str` | Descrição textual da ação do usuário. Ex: `"Click the Login button"` |
| `extracted_data` | `List[ExtractedElement]` | Lista de elementos HTML necessários para executar este passo (vazia na fase de reestruturação; preenchida após extração) |

</div>

#### `ModuleModel`:
Um **módulo** do caso de teste, correspondendo a uma URL específica.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `url` | `str` | URL completa onde esta parte do teste é executada (com protocolo) |
| `purpose` | `str` | Descrição breve do objetivo desta página no teste |
| `execution_steps` | `List[ExecutionStepModel]` | Lista de passos de execução nesta página |

</div>

#### `TestCaseModel`:
O **caso de teste completo**, composto por um ou mais módulos.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `testCase` | `str` | Nome do caso de teste |
| `modules` | `List[ModuleModel]` | Lista de módulos (URLs) que compõem o teste |

</div>

#### `ExtractedModuleModel` (herda de `ModuleModel`):
Um módulo **enriquecido** com metadados da extração LLM.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| *(herda todos de `ModuleModel`)* | | |
| `token` | `Optional[TokenUsageModel]` | Estatísticas de consumo de tokens da chamada LLM |
| `dispatcher` | `Optional[DispatcherStatsModel]` | Métricas de performance do crawler |

</div>

#### `ExtractedTestCaseModel` (herda de `TestCaseModel`):
Um caso de teste onde os módulos são do tipo `ExtractedModuleModel`.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| *(herda todos de `TestCaseModel`)* | | |
| `modules` | `List[ExtractedModuleModel]` | Módulos com metadados de extração |

</div>

#### `TokenUsageModel`:
Consumo de tokens agregado de uma chamada LLM.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `completion_tokens` | `int` | Tokens gastos na resposta |
| `prompt_tokens` | `int` | Tokens gastos no prompt |
| `total_tokens` | `int` | Total de tokens consumidos |

</div>

#### `DispatcherStatsModel`:
Métricas de performance do dispatcher do crawl4ai.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `memory_usage_MB` | `float` | Memória usada durante o crawl (MB) |
| `peak_memory_MB` | `float` | Pico de uso de memória (MB) |
| `start_time` | `Optional[str]` | Timestamp ISO-8601 de início |
| `end_time` | `Optional[str]` | Timestamp ISO-8601 de término |
| `duration_seconds` | `float` | Duração total em segundos |

</div>

#### `ExtractionContainer`:
Wrapper que agrupa todos os elementos extraídos de uma página.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `elements` | `List[ExtractedElement]` | Todos os elementos HTML extraídos da página |

</div>

#### `ExtractionResultModel`:
Resultado completo de uma passada de extração ou refinamento.

<div align="center">

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `extracted_content` | `List[ExtractedElement]` | Elementos extraídos |
| `token_usage` | `TokenUsageModel` | Estatísticas de tokens |
| `dispatcher_data` | `DispatcherStatsModel` | Métricas do dispatcher |

</div>

---

## 7. Prompts: De strings embutidas para templates Jinja2 (`src/prompts/`):

### No script original:

Os prompts eram **f-strings gigantes** embutidas diretamente no código:

```python
# genIAE2ETest.py (script original), prompt de reestruturação (~50 linhas de f-string)
completion = client.beta.chat.completions.parse(
    model="gpt-4o-mini",
    messages=[{
        "role": "system",
        "content": f"""You are a highly skilled software test automation engineer...
                       Test Case: {test_case}
                       ...  (dezenas de linhas)  ..."""
    }],
    response_format=TestCaseModel
)
```

O mesmo padrão se repetia para os prompts de extração, refinamento e geração, todos inline, tornando o código ilegível e impossível de manter.

### Na nova arquitetura → `src/prompts/` + `src/tools/load_prompt.py`:

Cada prompt agora é um **arquivo Jinja2** (`.j2`) separado, e a injeção de variáveis é feita via template rendering:

<div align="center">

| Arquivo | Fase | Variáveis do template |
|---------|------|-----------------------|
| `level1_restructuring.j2` | Level 1, Reestruturação | `{{ test_case }}` |
| `level2_extraction.j2` | Level 2, Extração | `{{ module }}` |
| `level2_refinement.j2` | Level 2, Refinamento | `{{ module_with_extracted_data }}` |
| `level3_generation.j2` | Level 3, Geração | `{{ test_case_with_extracted_data }}` |

</div>

O carregamento é feito por uma **função utilitária** simples:

```python
# src/tools/load_prompt.py

from src.env import env_variables

_env = Environment(loader=FileSystemLoader(env_variables.prompts_dir))

def load_prompt(template_name: str, **kwargs) -> str:
    template = _env.get_template(template_name)
    return template.render(**kwargs)
```

**Uso nos nós:**
```python
# Exemplo no nó de reestruturação
prompt = load_prompt("level1_restructuring.j2", test_case=state["test_case"])
```

**O que mudou:**
- Prompts podem ser editados sem tocar em código Python.
- Variáveis são injetadas de forma segura e explícita via Jinja2.
- Facilidade para versionar, testar ou trocar prompts.

---

## 8. Ferramentas Utilitárias: `src/tools/`:

Este pacote contém **toda a infraestrutura** que o script original usava de forma dispersa e ad-hoc.

### 8.1 `browser.py`, De `AsyncWebCrawler` inline para `BrowserManager` + `BrowserTool`:

#### No script original:

O crawler era instanciado diretamente no `main()` e reutilizado manualmente:

```python
# genIAE2ETest.py (script original)
async with AsyncWebCrawler() as crawler:
    # ... todo o loop vive dentro deste context manager
    llm_strategy_1 = LLMExtractionStrategy(...)
    crawl_config_1 = CrawlerRunConfig(...)
    result_1 = await crawler.arun_many(urls=[...], config=crawl_config_1, dispatcher=dispatcher)
    # ... parsing manual do resultado ...
    test_case_json1["modules"][n]["extracted_data"] = json.loads(result.extracted_content)
    # ... montagem manual de token_data e dispatcher_data como dicts ...
```

Cada iteração criava um novo `LLMExtractionStrategy`, um novo `CrawlerRunConfig`, e o parsing do resultado era feito manualmente com `json.loads` e atribuição direta em dicionários.

#### Na nova arquitetura:

Duas classes cuidam disso:

- **`BrowserManager`**: Um **singleton** que gerencia uma única instância de `AsyncWebCrawler`, com controle de lock assíncrono para acesso seguro.
- **`BrowserTool`**: Uma ferramenta de alto nível usada como **async context manager** (`async with BrowserTool() as browser:`). Recebe URL, instrução e schema Pydantic, e devolve um dicionário tipado com `extracted_content`, `token_usage` e `dispatcher_data`.

```python
# Uso na nova arquitetura (dentro de um agente)
async with BrowserTool() as browser:
    result = await browser.extract_elements(
        url=url,
        instruction=prompt,
        schema=ExtractionContainer,
        temperature=0.0,
    )
```

Toda a complexidade de configurar `LLMExtractionStrategy`, `CrawlerRunConfig`, parsear JSON, validar com Pydantic, montar dados de token e dispatcher, tudo está encapsulado internamente no `BrowserTool.extract_elements()`.

### 8.2 `gen_ia_client.py`, De instanciação repetida para `GenIAClientProvider` (Singleton):

#### No script original:

O client OpenAI era criado **dentro do loop**, para cada arquivo de teste:

```python
# genIAE2ETest.py (script original)
for arquivo in exampleFolder.iterdir():
    client = openai.OpenAI(api_key=api_key_string)
    completion = client.beta.chat.completions.parse(...)
```

#### Na nova arquitetura:

O `GenIAClientProvider` garante **uma única instância** do client:

```python
# src/tools/gen_ia_client.py
class GenIAClientProvider:
    _client: Optional[GenIAClient] = None

    @classmethod
    def get_client(cls) -> GenIAClient:
        if cls._client is None:
            cls._client = openai.OpenAI(api_key=env_variables.api_key_string)
        return cls._client
```

### 8.3 `file_system.py`, De `open()` espalhados para funções centralizadas:

#### No script original:

Operações de I/O estavam espalhadas por todo o script:

```python
# genIAE2ETest.py (script original)
with open(arquivo, 'r', encoding='utf-8') as file:
    test_case = file.read()
with open(newRefinedTestCase, "w", encoding="utf-8") as f:
    f.write(refinedTestCase)
with open(newTestCaseFileAttemptExtractedData, "w", encoding="utf-8") as f:
    json.dump(test_case_json1, f, indent=4, ensure_ascii=False)
```

#### Na nova arquitetura:

Funções utilitárias dedicadas: `read_file()`, `write_file()`, `write_json_file()`, `read_json_file()`, `create_directory_if_not_exists()`, todas em `src/tools/file_system.py`, com logging integrado.

### 8.4 `parser.py`, De `map_extracted_data_to_steps()` global para módulo dedicado:

#### No script original:

A função `map_extracted_data_to_steps()` vivia como função global no script, trabalhava com **dicionários brutos** e manipulava chaves manualmente:

```python
# genIAE2ETest.py (script original)
def map_extracted_data_to_steps(module):
    extracted_items = module.get("extracted_data", [])
    matched_indices = set()
    for step in module.get("execution_steps", []):
        matched_data = []
        for idx, data in enumerate(extracted_items):
            if data.get("step_name") == step.get("step"):
                matched_data.append({
                    "type": data["type"],
                    "request_description": data["request_description"],
                    ...
                })
                matched_indices.add(idx)
        if matched_data:
            step["extracted_data"] = matched_data
    ...
```

#### Na nova arquitetura:

A mesma lógica agora trabalha com **objetos Pydantic tipados**:

```python
# src/tools/parser.py
def map_extracted_data_to_steps(
    module_model: ExtractedModuleModel,
    extracted_elements: List[ExtractedElement],
) -> ExtractedModuleModel:
    for step in module_model.execution_steps:
        step_elements = [el for el in extracted_elements if el.step_name == step.step]
        if step_elements:
            step.extracted_data = step_elements
    return module_model
```

Além disso, a função `strip_markdown_code_fences()` foi adicionada para limpar a saída do LLM na geração de scripts Robot Framework.

### 8.5 `load_prompt.py`, Carregador de templates Jinja2:

**Completamente novo.** Usa o Jinja2 `Environment` configurado com o diretório de prompts para renderizar templates de forma segura e declarativa.

---

## 9. Utilitários Compartilhados: `src/utils/`:

### 9.1 `enums.py`, Enumerações tipadas:

**Completamente novo.** Define dois enums que antes eram representados implicitamente pela posição no loop:

```python
class GenIANodeName(StrEnum):
    """Identificadores dos nós do grafo LangGraph."""
    START = START          # Nó inicial do LangGraph
    END = END              # Nó final do LangGraph
    RESTRUCTURING_TASK = auto()
    EXPLORING_TASK = auto()
    REFINING_TASK = auto()
    CODING_TASK = auto()

class GenIAStateStatus(StrEnum):
    """Status de execução da máquina de estados."""
    STARTING = auto()
    RESTRUCTURING = auto()
    EXPLORING = auto()
    REFINING = auto()
    CODING = auto()
    FINISHED = auto()
```

No script original, não havia conceito de "status", o fluxo era determinado pela posição linear no código.

### 9.2 `logger.py`, Sistema de logging:

**Completamente novo.** O script original usava apenas `print()`:

```python
# genIAE2ETest.py (script original)
print("Pag ", n+1, ". Identifying relevant elements...")
print("Usages llm1:............")
print("Generating Robot Framework script...")
```

Na nova arquitetura, há um sistema de logging hierárquico com:
- Saída no console (stdout)
- Saída em arquivo (`logs/genia_YYYYMMDD_HHMMSS.log`)
- Nome do módulo/componente em cada mensagem
- Níveis de severidade (DEBUG, INFO, WARNING, ERROR, CRITICAL)

---

## 10. O Coração da Nova Arquitetura: O Grafo LangGraph (`src/graph/`):

A maior transformação na reestruturação é a introdução do **LangGraph** como framework de orquestração. O que antes era um fluxo sequencial imperativo dentro de um `for` loop agora é um **grafo de estados compilado**, com nós, arestas condicionais e estado compartilhado.

O pacote `src/graph/` se organiza em quatro subdiretórios com responsabilidades bem definidas:

<div align="center">

| Subdiretório | Responsabilidade |
|-------------|------------------|
| `agents/` | **O que fazer**, Funções que executam chamadas à LLM ou ao crawler |
| `nodes/` | **Quando fazer**, Funções de nó que manipulam o estado e delegam aos agentes |
| `edges/` | **Para onde ir**, Funções de roteamento que decidem o próximo nó |
| *(raiz)* | Orquestrador, estado e mapas de roteamento |

</div>

---

## 11. Estado Compartilhado: `GenIAState`:

### No script original:

O "estado" era um amontoado de variáveis locais dentro do `main()`:

```python
# genIAE2ETest.py (script original)
test_case = file.read()                                                           # texto bruto
refinedTestCase = completion.choices[0].message.parsed.model_dump_json(indent=2)  # JSON do caso reestruturado
test_case_example = json.loads(refinedTestCase)                                   # dict do caso estruturado
test_case_json1 = json.loads(refinedTestCase)                                     # cópia para extração
test_case_json2 = json.loads(refinedTestCase)                                     # cópia para refinamento
```

### Na nova arquitetura → `src/graph/state.py`:

O `GenIAState` é um **TypedDict** que define explicitamente todos os dados compartilhados entre os nós do grafo:

```python
class GenIAState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]          # Mensagens entre agentes
    execution_status: GenIAStateStatus                            # Fase atual do workflow
    attempt_number: int                                           # Número da tentativa
    test_case: str                                                # Texto bruto do caso de teste
    test_case_name: str                                           # Nome identificador
    output_directory: str                                         # Pasta de saída
    current_module_index: int                                     # Índice do módulo sendo processado
    refined_test_case: Optional[TestCaseModel]                    # Após Level 1
    extracted_test_case: Optional[ExtractedTestCaseModel]         # Após Level 2 Pass 1
    refined_extracted_test_case: Optional[ExtractedTestCaseModel] # Após Level 2 Pass 2
    script_robot: Optional[str]                                   # Script gerado (Level 3)
```

**Mapeamento do script original para o estado:**

<div align="center">

| Script Original (variável) | Estado (`GenIAState`) | Descrição |
|-----------------------|----------------------|-----------|
| `test_case = file.read()` | `state["test_case"]` | Texto bruto de entrada |
| `arquivo.stem` | `state["test_case_name"]` | Nome do caso de teste |
| `refinedTestCase` / `test_case_example` | `state["refined_test_case"]` | Saída do Level 1 (como `TestCaseModel`, não mais JSON/dict) |
| `test_case_json1` | `state["extracted_test_case"]` | Saída do Level 2 Pass 1 |
| `test_case_json2` | `state["refined_extracted_test_case"]` | Saída do Level 2 Pass 2 |
| `robot_test.choices[0].message.content` | `state["script_robot"]` | Script Robot Framework |
| `n` (índice do loop de módulos) | `state["current_module_index"]` | Controle de iteração |
| *(não existia)* | `state["execution_status"]` | Status da máquina de estados |
| *(não existia)* | `state["messages"]` | Histórico de mensagens entre agentes |

</div>

---

## 12. Agentes (Agents): `src/graph/agents/`:

Os "agentes" são as funções que **efetivamente fazem as chamadas** à LLM ou ao crawler. Eles encapsulam a interação com serviços externos e retornam dados tipados.

### Mapeamento: Script Original → Agentes:

<div align="center">

| Trecho do Script Original | Agente | Arquivo |
|----------------------|--------|---------|
| `client.beta.chat.completions.parse(model="gpt-4o-mini", messages=[...], response_format=TestCaseModel)` | `generate_test_case_refactor()` | `test_refactor.py` |
| `crawler.arun_many(urls=[...], config=crawl_config_1, dispatcher=...)` (1ª passada) | `extract_elements_from_page()` | `explorer.py` |
| `crawler.arun_many(urls=[...], config=crawl_config_2, dispatcher=...)` (2ª passada) | `refine_extracted_elements()` | `refiner.py` |
| `client.chat.completions.create(model="gpt-4o-mini", messages=[...])` (geração do script) | `generate_robot_script()` | `coder.py` |

</div>

**Melhorias aplicadas a todos os agentes:**
- **`@retry` com backoff exponencial** (via `tenacity`): o script original não tinha nenhum mecanismo de retry.
- **Tipagem completa** de parâmetros e retornos.
- **Docstrings descritivas**.
- **Logging estruturado**.
- Os agentes do `explorer.py` e `refiner.py` tratam `TargetClosedError` do Playwright para não retries em erros fatais.

---

## 13. Nós (Nodes): `src/graph/nodes/`:

Os **nós** são as funções que o LangGraph chama em cada fase do grafo. Cada nó:
1. Lê dados do **estado** (`GenIAState`).
2. **Carrega o prompt** Jinja2 correspondente.
3. **Chama o agente** apropriado.
4. **Atualiza o estado** com os resultados.
5. **Emite uma mensagem** (`AIMessage`) para o histórico.

### Mapeamento: Script Original → Nós:

#### `restructuring_node` (Level 1):

Corresponde ao trecho do script original:
```python
# genIAE2ETest.py (script original)
completion = client.beta.chat.completions.parse(
    model="gpt-4o-mini",
    messages=[{"role": "system", "content": f"""... prompt de reestruturação ..."""}],
    response_format=TestCaseModel
)
refinedTestCase = completion.choices[0].message.parsed.model_dump_json(indent=2)
```

Na nova arquitetura, é o nó `restructuring_node` que:
- Carrega o prompt via `load_prompt("level1_restructuring.j2", test_case=state["test_case"])`.
- Chama `generate_test_case_refactor(client, prompt)`.
- Salva o resultado em `state["refined_test_case"]` como um `TestCaseModel` (objeto Pydantic, não string JSON).

#### `extraction_node` (Level 2, Pass 1):

Corresponde ao trecho do script original:
```python
# genIAE2ETest.py (script original)
llm_strategy_1 = LLMExtractionStrategy(...)
crawl_config_1 = CrawlerRunConfig(...)
result_1 = await crawler.arun_many(urls=[test_case_json1["modules"][n]["url"]], ...)
# ... parsing manual ...
test_case_json1["modules"][n]["extracted_data"] = json.loads(result.extracted_content)
# ... montagem de token_data e dispatcher_data ...
test_case_json1["modules"][n] = map_extracted_data_to_steps(test_case_json1["modules"][n])
```

Na nova arquitetura:
- Inicializa `extracted_test_case` e `refined_extracted_test_case` na primeira iteração.
- Carrega o prompt via `load_prompt("level2_extraction.j2", module=...)`.
- Chama `extract_elements_from_page(url, prompt)` → retorna `ExtractionResultModel`.
- Usa `map_extracted_data_to_steps()` com objetos Pydantic tipados.
- Atualiza `state["extracted_test_case"]`.

#### `refinement_node` (Level 2, Pass 2):

Corresponde ao trecho do script original:
```python
# genIAE2ETest.py (script original)
llm_strategy_2 = LLMExtractionStrategy(...)
crawl_config_2 = CrawlerRunConfig(...)
result_2 = await crawler.arun_many(urls=[test_case_json1["modules"][n]["url"]], ...)
# ... parsing manual ...
test_case_json2["modules"][n]["extracted_data"] = json.loads(result.extracted_content)
# ... montagem de token_data e dispatcher_data ...
test_case_json2["modules"][n] = map_extracted_data_to_steps(test_case_json2["modules"][n])
```

Na nova arquitetura:
- Carrega o prompt via `load_prompt("level2_refinement.j2", module_with_extracted_data=...)`.
- Chama `refine_extracted_elements(url, prompt)` → retorna `ExtractionResultModel`.
- Usa `map_extracted_data_to_steps()` para mapear elementos aos passos.
- **Incrementa `current_module_index`** e muda o status para `EXPLORING` (mais módulos) ou `CODING` (todos processados).

#### `generation_node` (Level 3):

Corresponde ao trecho do script original:
```python
# genIAE2ETest.py (script original)
robot_test = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a skilled test automation engineer..."},
        {"role": "user", "content": f"... {test_case_json2} ... generate Robot Framework ..."}
    ]
)
```

Na nova arquitetura:
- Carrega o prompt via `load_prompt("level3_generation.j2", test_case_with_extracted_data=...)`.
- Chama `generate_robot_script(client, prompt)`.
- Salva em `state["script_robot"]`.
- Muda o status para `FINISHED`.

---

## 14. Arestas Condicionais (Edges): `src/graph/edges/`:

### No script original:

O fluxo de controle era determinado pela **estrutura dos loops**:

```python
# genIAE2ETest.py (script original), fluxo implícito
for n in range(len(test_case_example["modules"])):
    # 1. Extração (llm_strategy_1 + crawl4ai)
    # 2. Refinamento (llm_strategy_2 + crawl4ai)
# 3. Geração (client.chat.completions.create)
```

### Na nova arquitetura:

As transições entre nós são gerenciadas por **funções de roteamento** que inspecionam o `execution_status` do estado:

<div align="center">

| Arquivo | Função | Lógica |
|---------|--------|--------|
| `route_after_restructuring.py` | `route_after_restructuring()` | Após Level 1 → sempre vai para `EXPLORING_TASK` |
| `route_after_extraction.py` | `route_after_extraction()` | Após extração → sempre vai para `REFINING_TASK` |
| `route_after_refinement.py` | `route_after_refinement()` | Após refinamento → `EXPLORING_TASK` (mais módulos) ou `CODING_TASK` (todos prontos) |

</div>

A função `route_after_refinement` é a **mais importante**, pois implementa a lógica que antes era o `for n in range(...)` do script original. Ela verifica:
- Se `execution_status == EXPLORING` → ainda há módulos pendentes → volta para extração.
- Se `execution_status == CODING` → todos os módulos processados → vai para geração.

---

## 15. Mapas de Roteamento: `routing_maps.py`:

Define os **mapas estáticos** consumidos pelo LangGraph para resolver as arestas condicionais:

```python
restructuring_routes_map = {
    GenIANodeName.EXPLORING_TASK.value: GenIANodeName.EXPLORING_TASK.value,
}
extraction_routes_map = {
    GenIANodeName.REFINING_TASK.value: GenIANodeName.REFINING_TASK.value,
}
refinement_routes_map = {
    GenIANodeName.EXPLORING_TASK.value: GenIANodeName.EXPLORING_TASK.value,  # loop
    GenIANodeName.CODING_TASK.value: GenIANodeName.CODING_TASK.value,        # finalizar
}
```

Estes mapas são passados como terceiro argumento em `workflow.add_conditional_edges()` no orquestrador.

> [!NOTE]
> **Por que esses mapas não são redundantes?**
>
> À primeira vista, mapear `"EXPLORING_TASK" → "EXPLORING_TASK"` parece desnecessário, mas esse dicionário traz três vantagens concretas:
>
> 1. **Validação antecipada (fail-fast):** O LangGraph usa o mapa para validar as rotas em tempo de compilação. Se a função de roteamento retornar uma string com erro de digitação (ex: `"EXPLORING_TASKS"` com "S" extra), o framework acusa o erro imediatamente, antes de gastar tokens da OpenAI. Sem o mapa, o erro só apareceria em tempo de execução.
>
> 2. **Desacoplamento de lógica:** A função de roteamento não precisa conhecer os nomes físicos dos nós. Idealmente, ela retorna uma *intenção* e o mapa traduz para o destino. O padrão correto de chaves semânticas seria algo como `"loop_required"` → `EXPLORING_TASK`, `"refinement_complete"` → `CODING_TASK`. Dessa forma, trocar o destino de uma rota exige alterar apenas uma linha no mapa, sem tocar na lógica da função.
>
> 3. **Documentação viva:** Ao abrir `routing_maps.py`, qualquer desenvolvedor enxerga imediatamente todas as transições possíveis do sistema, sem precisar ler o código interno de cada função de roteamento.

---

## 16. Orquestrador: `orchestrator.py`:

### No script original:

Não existia um orquestrador, tudo vivia dentro do `main()`.

### Na nova arquitetura → `GenIAStateOrchestrator`:

A classe `GenIAStateOrchestrator` é o ponto central que:

1. **Compila o grafo** (`_build_graph()`), registra nós, arestas condicionais e arestas estáticas.
2. **Gera visualização** (`visualize_workflow()`), salva um PNG do grafo via Mermaid.
3. **Executa o workflow** (`run()`), inicializa o estado, invoca o grafo compilado e salva os artefatos de saída.
4. **Salva artefatos** (`_save_outputs()`), persiste `ExtractedData.json`, `RefinedExtractedData.json` e `E2ETest.robot`.

**Correspondência com o script original:**

<div align="center">

| Script Original | Orquestrador |
|-----------|-------------|
| `create_directory_if_not_exists(newFolder)` | `__init__()`, cria diretório de saída |
| Todo o loop de iteração | `run()`, inicializa estado e invoca `self.graph.ainvoke(initial_state)` |
| `with open(ExtractedData, "w") as f: json.dump(...)` | `_save_outputs()`, salva ExtractedData.json |
| `with open(RefinedExtractedData, "w") as f: json.dump(...)` | `_save_outputs()`, salva RefinedExtractedData.json |
| `with open(E2ETest.robot, "w") as f: f.write(...)` | `_save_outputs()`, salva E2ETest.robot |
| *(não existia)* | `visualize_workflow()`, gera PNG do grafo |

</div>

---

## 17. O que Mudou na Nova Arquitetura:

<div align="center">

| Aspecto | Script Original | Nova Arquitetura |
|---------|-----------|-----------------|
| **Manutenibilidade** | Alterar um prompt exige mexer em lógica Python | Prompts são arquivos `.j2` independentes |
| **Testabilidade** | Impossível testar funções isoladamente | Cada agente, nó e ferramenta pode ser testado unitariamente |
| **Escalabilidade** | Adicionar nova fase = reescrever o loop | Adicionar nova fase = criar nó + agente + aresta |
| **Resiliência** | Sem retry, qualquer falha aborta tudo | Retry com backoff exponencial em todo agente |
| **Observabilidade** | `print()` | Logger hierárquico com arquivo + console |
| **Tipagem** | Dicionários genéricos (`dict`) | Pydantic models + TypedDict completo |
| **Rastreabilidade** | Sem histórico de execução | `messages` no estado + status explícito por fase |
| **Reutilização** | Código duplicado (extraction ≈ refinement) | Agentes e ferramentas compartilhados |
| **Visualização** | Nenhuma | Grafo PNG gerado automaticamente |
| **Configuração** | Variáveis soltas | Dataclass centralizada com validação |

</div>
