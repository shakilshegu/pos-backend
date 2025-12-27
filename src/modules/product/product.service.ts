import { ProductRepository } from './product.repository';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { AppError } from '../../middlewares/error.middleware';

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  async createProduct(data: CreateProductDto) {
    // Check if SKU exists (only if SKU is provided)
    if (data.sku) {
      const existingSku = await this.productRepository.findBySku(data.sku);
      if (existingSku) {
        throw new AppError('SKU already exists', 400);
      }
    }

    return await this.productRepository.create(data);
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async getProductsByStore(storeId: string, page = 1, limit = 20) {
    return await this.productRepository.findByStoreId(storeId, page, limit);
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return await this.productRepository.update(id, data);
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return await this.productRepository.delete(id);
  }

  async searchProducts(storeId: string, query: string, page = 1, limit = 20) {
    if (!query || query.trim().length === 0) {
      return await this.productRepository.findByStoreId(storeId, page, limit);
    }

    return await this.productRepository.search(storeId, query.trim(), page, limit);
  }
}
