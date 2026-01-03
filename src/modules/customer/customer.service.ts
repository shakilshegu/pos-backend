import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';
import { AppError } from '../../middlewares/error.middleware';

export class CustomerService {
  private customerRepository: CustomerRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async create(data: CreateCustomerDto) {
    // Check if customer with same phone already exists in company
    const existingCustomer = await this.customerRepository.findByPhone(
      data.phone,
      data.companyId
    );

    if (existingCustomer) {
      throw new AppError(
        'Customer with this phone number already exists in your company',
        400
      );
    }

    return await this.customerRepository.create(data);
  }

  async findAll(companyId?: string) {
    return await this.customerRepository.findAll(companyId);
  }

  async findById(id: string) {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  async findByPhone(phone: string, companyId: string) {
    const customer = await this.customerRepository.findByPhone(phone, companyId);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  async search(params: {
    phone?: string;
    name?: string;
    email?: string;
    companyId?: string;
  }) {
    return await this.customerRepository.search(params);
  }

  async update(id: string, data: UpdateCustomerDto) {
    // Check if customer exists
    await this.findById(id);

    // If phone is being updated, check if new phone already exists
    if (data.phone) {
      const customer = await this.customerRepository.findById(id);
      const existingByPhone = await this.customerRepository.findByPhone(
        data.phone,
        customer!.companyId
      );

      if (existingByPhone && existingByPhone.id !== id) {
        throw new AppError('Customer with this phone number already exists', 400);
      }
    }

    return await this.customerRepository.update(id, data);
  }

  async delete(id: string) {
    // Check if customer exists
    await this.findById(id);

    // Check if customer has orders
    const customer = await this.customerRepository.findById(id);
    if (customer && customer._count.orders > 0) {
      throw new AppError(
        'Cannot delete customer with existing orders. Consider deactivating instead.',
        400
      );
    }

    return await this.customerRepository.delete(id);
  }

  async findByCompany(companyId: string) {
    return await this.customerRepository.findByCompany(companyId);
  }
}
