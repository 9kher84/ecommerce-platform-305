import React, { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import apiService from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const ProductManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    stock: 10,
    images: [""],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, catsRes] = await Promise.all([
        apiService.apiFetch("/api/products/my-products"), // Need to implement this endpoint or filter client side
        apiService.getAllCategories(),
      ]);

      // If my-products endpoint doesn't exist, we might need to fetch all and filter (not ideal but fallback)
      // For now assuming we will add this endpoint or it returns empty
      setProducts(productsRes.data?.products || []);
      setCategories(catsRes.data?.categories || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      // Fallback for categories if failed
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("تم إضافة المنتج بنجاح");
      setIsCreating(false);
      fetchData(); // Refresh
    } catch (err) {
      alert("فشل إضافة المنتج: " + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة منتجاتي</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-indigo-100">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">
            بيانات المنتج الجديد
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                اسم المنتج
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                الوصف
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  السعر
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  الكمية المتوفرة
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                القسم
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">اختر القسم...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar || c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold"
            >
              حفظ المنتج
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-8">
            لا توجد منتجات مضافة حالياً.
          </p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">
                {product.description}
              </p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-green-600 font-bold">
                  {product.price} ريال
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  المخزون: {product.stock}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
