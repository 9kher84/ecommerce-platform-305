import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useRegister } from '../../hooks/queries/authQueries';

export const Register = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const registerMutation = useRegister();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');

  const password = watch('password');

  const onSubmit = (data) => {
    setAuthError('');
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...submitData } = data;
    
    // Convert sectorIds from string to array of numbers
    if (submitData.sectorIds) {
      submitData.sectorIds = submitData.sectorIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    } else {
      submitData.sectorIds = [];
    }

    registerMutation.mutate(submitData, {
      onSuccess: () => {
        window.location.href = '/dashboard';
      },
      onError: (error) => {
        setAuthError(error.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">إنشاء حساب جديد</h2>
      
      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {authError}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="name"
          label="الاسم الكامل"
          {...register('name', { required: 'الاسم مطلوب' })}
          error={errors.name?.message}
        />

        <Input
          id="email"
          label="البريد الإلكتروني"
          type="email"
          {...register('email', { 
            required: 'البريد الإلكتروني مطلوب',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'بريد إلكتروني غير صالح'
            }
          })}
          error={errors.email?.message}
        />

        <Input
          id="password"
          label="كلمة المرور"
          type="password"
          {...register('password', { 
            required: 'كلمة المرور مطلوبة',
            minLength: { value: 6, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }
          })}
          error={errors.password?.message}
        />

        <Input
          id="confirmPassword"
          label="تأكيد كلمة المرور"
          type="password"
          {...register('confirmPassword', { 
            required: 'تأكيد كلمة المرور مطلوب',
            validate: value => value === password || 'كلمات المرور غير متطابقة'
          })}
          error={errors.confirmPassword?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع الحساب</label>
            <select
              {...register('role', { required: 'يرجى اختيار نوع الحساب' })}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.role ? 'border-red-300' : 'border-gray-300'}`}
            >
              <option value="">اختر...</option>
              <option value="buyer">مشتري</option>
              <option value="seller">بائع</option>
            </select>
            {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>}
          </div>

          <Input
            id="sectorIds"
            label="القطاعات (معرفات مفصولة بفاصلة)"
            {...register('sectorIds')}
            placeholder="مثال: 1, 2"
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          isLoading={registerMutation.isPending}
        >
          تسجيل
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
};
