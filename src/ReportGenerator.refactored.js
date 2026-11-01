// --- Regras de negócio (antes "números mágicos" espalhados no método) ---
const ADMIN_PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

// --- Políticas de visibilidade por papel do usuário ---
// Substituem o if/else aninhado por papel (Replace Conditional with Polymorphism).

const ROLE_POLICIES = {
  ADMIN: {
    canSee: () => true,
    isPriority: (item) => item.value > ADMIN_PRIORITY_THRESHOLD,
  },
  USER: {
    canSee: (item) => item.value <= USER_MAX_VISIBLE_VALUE,
    isPriority: () => false,
  },
};

const NO_ACCESS_POLICY = {
  canSee: () => false,
  isPriority: () => false,
};

function policyFor(user) {
  return ROLE_POLICIES[user.role] ?? NO_ACCESS_POLICY;
}

// --- Formatadores: cada classe cuida de cabeçalho, corpo e rodapé de um formato ---

class ReportFormatter {
  /**
   * Template Method: monta o relatório a partir das três seções.
   * @param {{ name: string }} user
   * @param {{ item: object, priority: boolean }[]} entries
   * @param {number} total
   */
  format(user, entries, total) {
    return [
      ...this.header(user),
      ...this.body(user, entries),
      ...this.footer(total),
    ].join('\n');
  }

  body(user, entries) {
    return entries.map((entry) => this.row(entry, user));
  }
}

class CsvReportFormatter extends ReportFormatter {
  header() {
    return ['ID,NOME,VALOR,USUARIO'];
  }

  row({ item }, user) {
    return `${item.id},${item.name},${item.value},${user.name}`;
  }

  footer(total) {
    return ['', 'Total,,', `${total},,`];
  }
}

class HtmlReportFormatter extends ReportFormatter {
  header(user) {
    return [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ];
  }

  row({ item, priority }) {
    const openTag = priority ? '<tr style="font-weight:bold;">' : '<tr>';
    return `${openTag}<td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
  }

  footer(total) {
    return ['</table>', `<h3>Total: ${total}</h3>`, '</body></html>'];
  }
}

const FORMATTERS = {
  CSV: new CsvReportFormatter(),
  HTML: new HtmlReportFormatter(),
};

// --- Funções auxiliares do corpo do relatório (Extract Method) ---

function selectVisibleEntries(items, policy) {
  return items
    .filter((item) => policy.canSee(item))
    .map((item) => ({ item, priority: policy.isPriority(item) }));
}

function sumValues(entries) {
  return entries.reduce((total, { item }) => total + item.value, 0);
}

// --- Classe principal: apenas orquestra as responsabilidades acima ---

export class ReportGenerator {
  /**
   * @param {import('./services/ItemService.js').ItemService} itemService
   *   Serviço que intermedeia o acesso ao banco de dados. O gerador
   *   não conhece o banco diretamente.
   */
  constructor(itemService) {
    this.itemService = itemService;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo (itens acima de 1000 são destacados).
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType];
    if (!formatter) {
      return '';
    }

    const entries = selectVisibleEntries(items, policyFor(user));
    return formatter.format(user, entries, sumValues(entries)).trim();
  }

  /**
   * Gera o relatório buscando os itens por meio do serviço injetado.
   */
  async generateReportFromService(reportType, user) {
    const items = await this.itemService.findAllItems();
    return this.generateReport(reportType, user, items);
  }
}
