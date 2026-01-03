import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import companyRoutes from './modules/company/company.routes';
import storeRoutes from './modules/store/store.routes';
import productRoutes from './modules/product/product.routes';
import productVariantRoutes from './modules/product-variant/product-variant.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import cashShiftRoutes from './modules/cash-shift/cash-shift.routes';
import orderRoutes from './modules/order/order.routes';
import uploadRoutes from './modules/upload/upload.routes';
import customerRoutes from './modules/customer/customer.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'POS Backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-variants', productVariantRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/shifts', cashShiftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/customers', customerRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
