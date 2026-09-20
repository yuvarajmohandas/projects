import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as productController from '../controllers/productController';

export const productsRouter = Router();

// ---- Public Catalog Endpoints ----
productsRouter.get('/categories', productController.getCategories);
productsRouter.get('/products', productController.getProducts);
productsRouter.get('/products/:id', productController.getProductById);
productsRouter.get('/homepage', productController.getHomepageLayout);

// ---- Admin Category Management ----
productsRouter.get('/admin/categories', requireAuth, requireAdmin, productController.getAdminCategories);
productsRouter.post('/admin/categories', requireAuth, requireAdmin, productController.createCategory);
productsRouter.put('/admin/categories/:id', requireAuth, requireAdmin, productController.updateCategory);
productsRouter.delete('/admin/categories/:id', requireAuth, requireAdmin, productController.deleteCategory);

// ---- Admin Product & Stock Management ----
productsRouter.get('/admin/products', requireAuth, requireAdmin, productController.getAdminProducts);
productsRouter.post('/admin/products', requireAuth, requireAdmin, productController.createProduct);
productsRouter.put('/admin/products/:id', requireAuth, requireAdmin, productController.updateProduct);
productsRouter.patch('/admin/products/:id/stock', requireAuth, requireAdmin, productController.updateStock);
productsRouter.delete('/admin/products/:id', requireAuth, requireAdmin, productController.deleteProduct);

// ---- Admin Homepage Layout Saving Endpoints ----
productsRouter.put('/admin/homepage', requireAuth, requireAdmin, productController.saveHomepageLayout);

// ---- Bulk CSV Upload Execution ----
productsRouter.post('/admin/products/bulk', requireAuth, requireAdmin, productController.bulkImportProducts);
