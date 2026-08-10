import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useLogin } from '../../hooks/queries/authQueries';
import { useAuth } from '../../providers/AuthProvider';

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [authError, setAuthError] = useState('');
  
  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = (data) => {
    setAuthError('');
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        login(res.user || res.data?.user || res.data); // Support both direct and axios wrapped schemas
        navigate(from);
      },
      onError: (error) => {
        setAuthError(error.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">تسجيل الدخول</h2>
      
      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {authError}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
          autoComplete="email"
        />

        <Input
          id="password"
          label="كلمة المرور"
          type="password"
          {...register('password', { required: 'كلمة المرور مطلوبة' })}
          error={errors.password?.message}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              نسيت كلمة المرور؟
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={loginMutation.isPending}
        >
          تسجيل الدخول
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
};
