import { StoreRepository } from './store.repository';
import { CreateStoreDto, UpdateStoreDto } from './store.dto';
import { AppError } from '../../middlewares/error.middleware';
import prisma from '../../config/database';

export class StoreService {
  private storeRepository: StoreRepository;

  constructor() {
    this.storeRepository = new StoreRepository();
  }

  async create(data: CreateStoreDto) {
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return await this.storeRepository.create(data);
  }

  async getByCompany(companyId: string) {
    return await this.storeRepository.findByCompany(companyId);
  }

  async getById(id: string) {
    const store = await this.storeRepository.findById(id);

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return store;
  }

  async update(id: string, data: UpdateStoreDto) {
    const store = await this.storeRepository.findById(id);

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return await this.storeRepository.update(id, data);
  }

  async delete(id: string) {
    const store = await this.storeRepository.findById(id);

    if (!store) {
      throw new AppError('Store not found', 404);
    }

    return await this.storeRepository.delete(id);
  }
}
