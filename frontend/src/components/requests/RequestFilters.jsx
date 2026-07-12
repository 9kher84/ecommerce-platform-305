import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const RequestFilters = ({ onFilterChange }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search, status });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1">
        <Input 
          id="search" 
          label="Search Requests" 
          placeholder="Search by title or description..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="w-full sm:w-48">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      <Button type="submit" className="w-full sm:w-auto">
        Apply Filters
      </Button>
    </form>
  );
};
