import React, { useState } from 'react';
import { Button } from '../common/Button';

export const PaymentTermsForm = ({ onSubmit, isLoading }) => {
  const [terms, setTerms] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(terms);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Update Payment & Contract Terms</h3>
      
      <div className="mb-4">
        <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-2">
          Notes / Terms
        </label>
        <textarea
          id="terms"
          rows={4}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          required
        />
      </div>
      
      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading}>
          Save Terms
        </Button>
      </div>
    </form>
  );
};
