import { ProductVariantRepository } from './product-variant.repository';
import { CreateProductVariantDto, UpdateProductVariantDto } from './product-variant.dto';

export class ProductVariantService {
  private productVariantRepository: ProductVariantRepository;

  constructor() {
    this.productVariantRepository = new ProductVariantRepository();
  }

  async create(data: CreateProductVariantDto, storeId: string) {
    // Check if SKU already exists
    if (data.sku) {
      const existingBySku = await this.productVariantRepository.findBySku(data.sku);
      if (existingBySku) {
        throw new Error('Product variant with this SKU already exists');
      }
    }

    // Check if barcode already exists
    if (data.barcode) {
      const existingByBarcode = await this.productVariantRepository.findByBarcode(data.barcode);
      if (existingByBarcode) {
        throw new Error('Product variant with this barcode already exists');
      }
    }

    return await this.productVariantRepository.create(data, storeId);
  }

  async findAll(productId?: string) {
    return await this.productVariantRepository.findAll(productId);
  }

  async findById(id: string) {
    const variant = await this.productVariantRepository.findById(id);
    if (!variant) {
      throw new Error('Product variant not found');
    }
    return variant;
  }

  async findBySku(sku: string) {
    const variant = await this.productVariantRepository.findBySku(sku);
    if (!variant) {
      throw new Error('Product variant not found');
    }
    return variant;
  }

  async findByBarcode(barcode: string) {
    const variant = await this.productVariantRepository.findByBarcode(barcode);
    if (!variant) {
      throw new Error('Product variant not found');
    }
    return variant;
  }

  async update(id: string, data: UpdateProductVariantDto) {
    // Check if variant exists
    await this.findById(id);

    // Check if SKU already exists (and belongs to different variant)
    if (data.sku) {
      const existingBySku = await this.productVariantRepository.findBySku(data.sku);
      if (existingBySku && existingBySku.id !== id) {
        throw new Error('Product variant with this SKU already exists');
      }
    }

    // Check if barcode already exists (and belongs to different variant)
    if (data.barcode) {
      const existingByBarcode = await this.productVariantRepository.findByBarcode(data.barcode);
      if (existingByBarcode && existingByBarcode.id !== id) {
        throw new Error('Product variant with this barcode already exists');
      }
    }

    return await this.productVariantRepository.update(id, data);
  }

  async delete(id: string) {
    // Check if variant exists
    await this.findById(id);

    return await this.productVariantRepository.delete(id);
  }

  async findByStore(storeId: string) {
    return await this.productVariantRepository.findByStore(storeId);
  }

  async findLowStock(storeId: string) {
    return await this.productVariantRepository.findLowStock(storeId);
  }
}
