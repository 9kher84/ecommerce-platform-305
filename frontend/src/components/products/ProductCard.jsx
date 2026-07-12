import React from 'react';

export const ProductCard = ({ product }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
      {product.image && (
        <div className="w-full h-48 bg-gray-100 rounded-md mb-4 overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-4" title={product.name}>
          {product.name}
        </h3>
        
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Estimated Price
              </span>
              <span className="text-xl font-bold text-gray-900">
                ${product.estimatedPrice}
              </span>
            </div>
            
            <div className="text-right">
              <span className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Stock Level
              </span>
              <span className="text-sm font-medium text-gray-700">
                {product.stockLevel || 0}
              </span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {product.category?.name_en || product.category?.name_ar || 'Uncategorized'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
