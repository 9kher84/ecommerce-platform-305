import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { authService } from '../../services/authService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ProfileSettings = () => {
  const { user, login } = useAuth(); // login actually sets user state in context
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || ''
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
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        // The endpoint returns { success: true, message, user }
        if (response.user) {
          // Re-trigger the getProfile implicitly or just reload page
          window.location.reload(); 
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Update failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Personal Profile</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6 max-w-lg">
          <Input 
            id="name" 
            label="Full Name" 
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input 
            id="email" 
            label="Email Address" 
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input 
            id="mobile" 
            label="Mobile Number" 
            type="tel"
            value={formData.mobile}
            onChange={handleChange}
          />
          
          <div className="pt-4">
            <Button type="submit" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
