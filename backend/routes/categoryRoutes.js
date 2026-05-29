const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect, restrictTo } = require("../middleware/authMiddleware"); // استيراد دوال الحماية والأدوار

// ----------------------------------------------------------------------
// 1. المسارات العامة (متاحة للجميع)
// ----------------------------------------------------------------------

// GET /api/categories - جلب جميع الفئات
router.get("/", categoryController.getAllCategories);

// GET /api/categories/:id - جلب فئة واحدة بالمعرف
router.get("/:id", categoryController.getCategoryById);

// ----------------------------------------------------------------------
// 2. مسارات الإدارة (مخصصة للمشرفين)
// ----------------------------------------------------------------------
// يتم تطبيق الحماية protect ثم restrictTo('super_admin', 'admin')

router.use(protect, restrictTo("super_admin", "admin"));

// POST /api/categories - إنشاء فئة جديدة
router.post("/", categoryController.createCategory);

router
  .route("/:id")
  // PUT /api/categories/:id - تحديث فئة بالمعرف
  .put(categoryController.updateCategory)
  // DELETE /api/categories/:id - حذف فئة بالمعرف
  .delete(categoryController.deleteCategory);

module.exports = router;
