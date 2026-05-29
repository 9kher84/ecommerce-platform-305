// categoryController.js - Real Database Implementation
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { Category } = require("../sequelize_setup");

// ----------------------------------------------------------------------
// 2. جلب جميع التصنيفات (متاح للعامة)
// ----------------------------------------------------------------------
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.findAll({
    attributes: ["id", "name_ar", "name_en"], // Sovereign Optimization: Fetch only needed fields
    limit: 100, // Sovereign Safety Cap
  });

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories,
    },
  });
});

// ----------------------------------------------------------------------
// 3. جلب تصنيف واحد حسب المعرف (متاح للعامة)
// ----------------------------------------------------------------------
exports.getCategoryById = catchAsync(async (req, res, next) => {
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    return next(new AppError("Category not found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      category,
    },
  });
});

// ----------------------------------------------------------------------
// 4. إنشاء تصنيف جديد (مخصص للمسؤولين)
// ----------------------------------------------------------------------
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name_ar, name_en, description_ar, description_en } = req.body;

  if (!name_ar || !name_en) {
    return next(
      new AppError(
        "الرجاء تقديم اسم التصنيف باللغتين العربية والإنجليزية.",
        400,
      ),
    );
  }

  // التحقق من تكرار الاسم
  const existingCategory = await Category.findOne({
    where: {
      [require("sequelize").Op.or]: [{ name_ar }, { name_en }],
    },
  });

  if (existingCategory) {
    return next(new AppError("هذا التصنيف موجود بالفعل.", 400));
  }

  const newCategory = await Category.create({
    name_ar,
    name_en,
    description_ar: description_ar || "",
    description_en: description_en || "",
  });

  res.status(201).json({
    status: "success",
    message: "Category created successfully",
    data: {
      category: newCategory,
    },
  });
});

// ----------------------------------------------------------------------
// 5. تحديث تصنيف موجود (مخصص للمسؤولين)
// ----------------------------------------------------------------------
exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    return next(new AppError("Category not found with that ID", 404));
  }

  await category.update(req.body);

  res.status(200).json({
    status: "success",
    message: "Category updated successfully",
    data: {
      category,
    },
  });
});

// ----------------------------------------------------------------------
// 6. حذف تصنيف (مخصص للمسؤولين) - حذف نهائي
// ----------------------------------------------------------------------
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByPk(req.params.id);

  if (!category) {
    return next(new AppError("Category not found with that ID", 404));
  }

  await category.destroy();

  res.status(204).json({
    status: "success",
    data: null,
  });
});
