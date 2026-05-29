import React, { useState, useEffect } from "react";
import apiService from "../services/apiService";
import { Plus, Trash, Edit, Save, X, DollarSign, Truck } from "lucide-react";

const SmartPricingConfig = () => {
  const [matrices, setMatrices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMatrix, setEditingMatrix] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    isActive: true,
    rules: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matricesRes, catsRes] = await Promise.all([
        apiService.apiFetch("/api/pricing-matrices"),
        apiService.getAllCategories(),
      ]);
      setMatrices(matricesRes || []);
      setCategories(catsRes.data.categories || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (matrix) => {
    setEditingMatrix(matrix);
    setFormData({
      name: matrix.name,
      categoryId: matrix.categoryId || "",
      isActive: matrix.isActive,
      rules: matrix.rules || [],
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingMatrix(null);
    setFormData({
      name: "",
      categoryId: "",
      isActive: true,
      rules: [], // Start with one empty rule?
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingMatrix(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId || null,
      };

      if (isCreating) {
        await apiService.apiFetch("/api/pricing-matrices", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (editingMatrix) {
        await apiService.apiFetch(`/api/pricing-matrices/${editingMatrix.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      fetchData();
      handleCancel();
    } catch (error) {
      console.error("Error saving matrix:", error);
      alert("فشل حفظ المصفوفة");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المصفوفة؟")) return;
    try {
      await apiService.apiFetch(`/api/pricing-matrices/${id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting matrix:", error);
      alert("فشل حذف المصفوفة");
    }
  };

  // Rule Management
  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          quantityMin: 1,
          quantityMax: 100,
          pricePerUnit: 0,
          deliveryFee: 0,
          cities: [],
        },
      ],
    }));
  };

  const updateRule = (index, field, value) => {
    const newRules = [...formData.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setFormData((prev) => ({ ...prev, rules: newRules }));
  };

  const removeRule = (index) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, rules: newRules }));
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          مصفوفة التسعير الذكي (Smart Pricing)
        </h2>
        {!isCreating && !editingMatrix && (
          <button
            onClick={handleCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة مصفوفة جديدة
          </button>
        )}
      </div>

      {isCreating || editingMatrix ? (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-bold mb-4">
            {isCreating ? "إنشاء مصفوفة جديدة" : "تعديل المصفوفة"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                اسم المصفوفة
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="مثال: تسعير الجملة للتمور"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                الفئة (اختياري)
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">عام (كل الفئات)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_ar || cat.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                قواعد التسعير
              </label>
              <button
                onClick={addRule}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center"
              >
                <Plus className="w-3 h-3 ml-1" /> إضافة قاعدة
              </button>
            </div>

            {formData.rules.length === 0 && (
              <p className="text-gray-500 text-sm italic">
                لا توجد قواعد مضافة.
              </p>
            )}

            <div className="space-y-3">
              {formData.rules.map((rule, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded border border-gray-200 flex flex-wrap gap-3 items-end"
                >
                  <div className="w-24">
                    <label className="text-xs text-gray-500">من كمية</label>
                    <input
                      type="number"
                      value={rule.quantityMin}
                      onChange={(e) =>
                        updateRule(
                          index,
                          "quantityMin",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full border rounded p-1 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-gray-500">إلى كمية</label>
                    <input
                      type="number"
                      value={rule.quantityMax}
                      onChange={(e) =>
                        updateRule(
                          index,
                          "quantityMax",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full border rounded p-1 text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-xs text-gray-500">
                      السعر للوحدة
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
                      <input
                        type="number"
                        value={rule.pricePerUnit}
                        onChange={(e) =>
                          updateRule(
                            index,
                            "pricePerUnit",
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full border rounded p-1 pl-6 text-sm"
                      />
                    </div>
                  </div>
                  <div className="w-32">
                    <label className="text-xs text-gray-500">
                      رسوم التوصيل
                    </label>
                    <div className="relative">
                      <Truck className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
                      <input
                        type="number"
                        value={rule.deliveryFee}
                        onChange={(e) =>
                          updateRule(
                            index,
                            "deliveryFee",
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-full border rounded p-1 pl-6 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeRule(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <Save className="w-4 h-4 ml-2" /> حفظ المصفوفة
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matrices.map((matrix) => (
            <div
              key={matrix.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow relative bg-gray-50"
            >
              <div className="absolute top-4 left-4 flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => handleEdit(matrix)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(matrix.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-lg mb-1">{matrix.name}</h3>
              <p className="text-sm text-gray-500 mb-2">
                {matrix.category
                  ? matrix.category.name_ar || matrix.category.name_en
                  : "عام (كل الفئات)"}
              </p>
              <div className="text-xs bg-white p-2 rounded border">
                <span className="font-semibold block mb-1">
                  القواعد ({matrix.rules?.length || 0}):
                </span>
                {matrix.rules &&
                  matrix.rules.slice(0, 2).map((r, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span>
                        {r.quantityMin}-{r.quantityMax} وحدة
                      </span>
                      <span>{r.pricePerUnit} ريال</span>
                    </div>
                  ))}
                {matrix.rules && matrix.rules.length > 2 && (
                  <div className="text-center text-gray-400 mt-1">
                    ...المزيد
                  </div>
                )}
              </div>
            </div>
          ))}

          {matrices.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              لا توجد مصفوفات تسعير حتى الآن. ابدأ بإنشاء واحدة!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartPricingConfig;
