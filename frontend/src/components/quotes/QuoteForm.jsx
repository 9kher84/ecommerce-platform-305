import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const QuoteForm = ({ onSubmit, isLoading }) => {
  const [price, setPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ price: Number(price), deliveryDate, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Submit a Quote</h3>
      
      <div className="space-y-4 mb-6">
        <Input 
          id="price" 
          label="Price ($)" 
          type="number"
          min="0"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        
        <Input 
          id="deliveryDate" 
          label="Estimated Delivery Date" 
          type="date"
          required
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes / Conditions (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="notes"
              rows={3}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Button type="submit" isLoading={isLoading} className="w-full">
        Submit Quote
      </Button>
    </form>
  );
};
