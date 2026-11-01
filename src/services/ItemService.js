/**
 * Camada de serviço responsável por intermediar o acesso aos itens
 * persistidos no banco de dados.
 *
 * Classes de domínio (como o ReportGenerator) dependem deste serviço,
 * e não do banco diretamente, preservando a separação entre as camadas
 * da arquitetura.
 */
export class ItemService {
  /**
   * @param {{ findAll: (collection: string) => Promise<object[]> | object[] }} database
   */
  constructor(database) {
    this.database = database;
  }

  /**
   * Recupera todos os itens disponíveis para compor relatórios.
   * @returns {Promise<object[]>}
   */
  async findAllItems() {
    const items = await this.database.findAll('items');
    return items ?? [];
  }
}
