import { ItemService } from '../src/services/ItemService.js';
import { ReportGenerator } from '../src/ReportGenerator.refactored.js';

// Banco de dados falso que registra as consultas recebidas.
function createFakeDatabase(items) {
  const queries = [];
  return {
    queries,
    findAll(collection) {
      queries.push(collection);
      return Promise.resolve(items);
    },
  };
}

const testItems = [
  { id: 1, name: 'Produto A', value: 300 },
  { id: 2, name: 'Produto B', value: 700 },
];

describe('ItemService (camada de acesso ao banco)', () => {
  it('deve buscar os itens na coleção "items" do banco', async () => {
    const database = createFakeDatabase(testItems);
    const service = new ItemService(database);

    const items = await service.findAllItems();

    expect(items).toEqual(testItems);
    expect(database.queries).toEqual(['items']);
  });

  it('deve retornar lista vazia quando o banco não retorna itens', async () => {
    const service = new ItemService(createFakeDatabase(undefined));

    const items = await service.findAllItems();

    expect(items).toEqual([]);
  });
});

describe('ReportGenerator com ItemService injetado', () => {
  it('deve gerar o relatório a partir dos itens fornecidos pelo serviço', async () => {
    const service = new ItemService(createFakeDatabase(testItems));
    const generator = new ReportGenerator(service);

    const report = await generator.generateReportFromService('CSV', {
      name: 'User',
      role: 'USER',
    });

    expect(report).toContain('1,Produto A,300,User');
    expect(report).not.toContain('2,Produto B,700,User');
    expect(report).toContain('Total,,\n300,,');
  });
});
