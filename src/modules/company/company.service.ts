import { CompanyRepository } from './company.repository';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';
import { AppError } from '../../middlewares/error.middleware';

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  async create(data: CreateCompanyDto) {
    const existingCompany = await this.companyRepository.findByEmail(data.email);

    if (existingCompany) {
      throw new AppError('Company email already registered', 400);
    }

    return await this.companyRepository.create(data);
  }

  async getAll() {
    return await this.companyRepository.findAll();
  }

  async getById(id: string) {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return company;
  }

  async update(id: string, data: UpdateCompanyDto) {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    if (data.email && data.email !== company.email) {
      const existingCompany = await this.companyRepository.findByEmail(data.email);
      if (existingCompany) {
        throw new AppError('Company email already exists', 400);
      }
    }

    return await this.companyRepository.update(id, data);
  }

  async delete(id: string) {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return await this.companyRepository.delete(id);
  }
}
