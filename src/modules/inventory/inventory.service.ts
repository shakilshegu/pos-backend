import { InventoryRepository } from './inventory.repository';
import { CreateInventoryDto, UpdateInventoryDto, AdjustInventoryDto } from './inventory.dto';

export class InventoryService {
  private inventoryRepository: InventoryRepository;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }

  async create(data: CreateInventoryDto) {
    // Check if inventory already exists for this variant and store
    const existing = await this.inventoryRepository.findByVariantAndStore(
      data.productVariantId,
      data.storeId
    );

    if (existing) {
      throw new Error('Inventory already exists for this product variant in this store');
    }

    return await this.inventoryRepository.create(data);
  }

  async findAll(storeId?: string) {
    return await this.inventoryRepository.findAll(storeId);
  }

  async findById(id: string) {
    const inventory = await this.inventoryRepository.findById(id);
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }

  async findByVariantAndStore(productVariantId: string, storeId: string) {
    const inventory = await this.inventoryRepository.findByVariantAndStore(productVariantId, storeId);
    if (!inventory) {
      throw new Error('Inventory not found for this product variant in this store');
    }
    return inventory;
  }

  async update(id: string, data: UpdateInventoryDto) {
    await this.findById(id);
    return await this.inventoryRepository.update(id, data);
  }

  async adjustQuantity(id: string, data: AdjustInventoryDto) {
    const inventory = await this.findById(id);

    // Check if adjustment would result in negative quantity
    if (inventory.quantity + data.adjustment < 0) {
      throw new Error('Adjustment would result in negative inventory quantity');
    }

    return await this.inventoryRepository.adjustQuantity(id, data.adjustment);
  }

  async delete(id: string) {
    await this.findById(id);
    return await this.inventoryRepository.delete(id);
  }

  async findLowStock(storeId: string) {
    return await this.inventoryRepository.findLowStock(storeId);
  }

  async findOutOfStock(storeId: string) {
    return await this.inventoryRepository.findOutOfStock(storeId);
  }

  async findByProduct(productId: string) {
    return await this.inventoryRepository.findByProduct(productId);
  }
}
