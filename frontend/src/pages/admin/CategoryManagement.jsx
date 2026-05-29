import React, { useState, useEffect } from "react";
import { FolderTree, Plus, Edit2, Trash2, Save, X } from "lucide-react";

const API_URL = "/api/categories";

// دالة محاكاة للانتظار
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CategoryManagement = () => {
  // حالة قائمة التصنيفات (بيانات وهمية)
  const [categories, setCategories] = useState([
    {
      id: 1,
      name_ar: "إلكترونيات",
      name_en: "Electronics",
      description_ar: "أجهزة إلكترونية",
      description_en: "Electronic devices",
    },
    {
      id: 2,
      name_ar: "أثاث",
      name_en: "Furniture",
      description_ar: "أثاث منزلي",
      description_en: "Home furniture",
    },
    {
      id: 3,
      name_ar: "سيارات",
      name_en: "Cars",
      description_ar: "سيارات ومركبات",
      description_en: "Cars and vehicles",
    },
  ]);

  // حالات النظام
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // حالات الإضافة
  const [newCategoryNameAr, setNewCategoryNameAr] = useState("");
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("");
  const [newCategoryDescriptionAr, setNewCategoryDescriptionAr] = useState("");
  const [newCategoryDescriptionEn, setNewCategoryDescriptionEn] = useState("");

  // حالات التعديل
  const [editingNameAr, setEditingNameAr] = useState("");
  const [editingNameEn, setEditingNameEn] = useState("");
  const [editingDescriptionAr, setEditingDescriptionAr] = useState("");
  const [editingDescriptionEn, setEditingDescriptionEn] = useState("");

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    await delay(500);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryNameAr.trim() || !newCategoryNameEn.trim()) {
      setError("يجب إدخال اسم التصنيف باللغتين العربية والإنجليزية.");
      return;
    }

    setIsLoading(true);
    setError(null);
    await delay(800);

    try {
      const newId = categories.length + 1;
      const newCategory = {
        id: newId,
        name_ar: newCategoryNameAr.trim(),
        name_en: newCategoryNameEn.trim(),
        description_ar: newCategoryDescriptionAr.trim(),
        description_en: newCategoryDescriptionEn.trim(),
      };

      setCategories([...categories, newCategory]);
      setNewCategoryNameAr("");
      setNewCategoryNameEn("");
      setNewCategoryDescriptionAr("");
      setNewCategoryDescriptionEn("");
      alert("تم إضافة التصنيف بنجاح (محاكاة).");
    } catch (err) {
      setError("فشل في إضافة التصنيف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التصنيف نهائيًا؟")) return;

    setIsLoading(true);
    setError(null);
    await delay(800);

    try {
      setCategories(categories.filter((cat) => cat.id !== id));
      alert("تم حذف التصنيف بنجاح (محاكاة).");
    } catch (err) {
      setError("فشل في حذف التصنيف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditingNameAr(category.name_ar);
    setEditingNameEn(category.name_en);
    setEditingDescriptionAr(category.description_ar || "");
    setEditingDescriptionEn(category.description_en || "");
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingNameAr("");
    setEditingNameEn("");
    setEditingDescriptionAr("");
    setEditingDescriptionEn("");
  };

  const handleSaveEdit = async (id) => {
    if (!editingNameAr.trim() || !editingNameEn.trim()) {
      setError("اسم التصنيف باللغتين لا يمكن أن يكون فارغاً.");
      return;
    }

    setIsLoading(true);
    setError(null);
    await delay(800);

    try {
      const updatedCategories = categories.map((cat) =>
        cat.id === id
          ? {
              ...cat,
              name_ar: editingNameAr.trim(),
              name_en: editingNameEn.trim(),
              description_ar: editingDescriptionAr.trim(),
              description_en: editingDescriptionEn.trim(),
            }
          : cat,
      );

      setCategories(updatedCategories);
      cancelEditing();
      alert(`تم تحديث التصنيف #${id} بنجاح (محاكاة).`);
    } catch (err) {
      setError("فشل في تحديث التصنيف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <FolderTree className="w-8 h-8 ml-3 text-primary-600" />
            إدارة التصنيفات
          </h1>
          <p className="text-gray-500 mt-2">
            إضافة وتعديل وحذف التصنيفات المتاحة في المنصة.
          </p>
        </header>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* نموذج إضافة تصنيف جديد */}
        <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-100 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Plus className="w-5 h-5 ml-2" />
            إضافة تصنيف جديد
          </h2>
          <form
            onSubmit={handleAddCategory}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              placeholder="الاسم بالعربية *"
              value={newCategoryNameAr}
              onChange={(e) => setNewCategoryNameAr(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="Name in English *"
              value={newCategoryNameEn}
              onChange={(e) => setNewCategoryNameEn(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="الوصف بالعربية"
              value={newCategoryDescriptionAr}
              onChange={(e) => setNewCategoryDescriptionAr(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="Description in English"
              value={newCategoryDescriptionEn}
              onChange={(e) => setNewCategoryDescriptionEn(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="md:col-span-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition duration-200 font-semibold flex items-center justify-center"
              disabled={isLoading}
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة التصنيف
            </button>
          </form>
        </div>

        {/* قائمة التصنيفات الحالية */}
        <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            التصنيفات الحالية ({categories.length})
          </h2>

          {categories.length === 0 && !isLoading ? (
            <p className="text-gray-500 p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              لا توجد تصنيفات حالياً.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      الاسم بالعربية
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name (English)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-primary-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editingNameAr}
                            onChange={(e) => setEditingNameAr(e.target.value)}
                            className="p-2 border border-blue-300 rounded-lg w-full"
                            disabled={isLoading}
                          />
                        ) : (
                          category.name_ar
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editingNameEn}
                            onChange={(e) => setEditingNameEn(e.target.value)}
                            className="p-2 border border-blue-300 rounded-lg w-full"
                            disabled={isLoading}
                          />
                        ) : (
                          category.name_en
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {editingId === category.id ? (
                          <div className="flex justify-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleSaveEdit(category.id)}
                              className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-full shadow-md transition duration-150"
                              title="حفظ التعديلات"
                              disabled={isLoading}
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full shadow-md transition duration-150"
                              title="إلغاء التعديل"
                              disabled={isLoading}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => startEditing(category)}
                              className="text-primary-600 hover:text-primary-800 p-2 rounded-full hover:bg-primary-100 transition duration-150"
                              title="تعديل التصنيف"
                              disabled={isLoading}
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition duration-150"
                              title="حذف التصنيف"
                              disabled={isLoading}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-xs text-gray-400">
          <p>لوحة تحكم المسؤول - الإصدار 1.0</p>
        </footer>
      </div>
    </div>
  );
};

export default CategoryManagement;
