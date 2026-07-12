import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm text-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          error ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
