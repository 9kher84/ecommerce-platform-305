import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { authService } from '../../services/authService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const CompanyProfile = () => {
  const { user } = useAuth(); 
  
  const [formData, setFormData] = useState({
    businessName: '',
    commercialRegister: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        businessName: user.businessName || '',
        commercialRegister: user.commercialRegister || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await authService.updateProfile(formData);
      if (response.success) {
        setMessage({ type: 'success', text: 'Company details updated successfully' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Update failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Profile</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500 mb-6">
          Update your business registration details here. These details might be visible to your trading partners.
        </p>

        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6 max-w-lg">
          <Input 
            id="businessName" 
            label="Business Name" 
            value={formData.businessName}
            onChange={handleChange}
            required
          />
          <Input 
            id="commercialRegister" 
            label="Commercial Register Number" 
            value={formData.commercialRegister}
            onChange={handleChange}
          />
          
          <div className="pt-4">
            <Button type="submit" isLoading={isLoading}>
              Save Company Details
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
