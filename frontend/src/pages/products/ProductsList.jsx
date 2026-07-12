import React from 'react';
import { useProducts } from '../../hooks/queries/productQueries';
import { ProductCard } from '../../components/products/ProductCard';

export const ProductsList = () => {
  const { data, isLoading, isError, error } = useProducts();

  const products = data?.products || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Inventory (Seller Catalog)</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Error loading products: {error?.message}
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              No products found in your inventory.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
