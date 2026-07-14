import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useForgotPassword } from '../../hooks/queries/authQueries';

export const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const forgotPasswordMutation = useForgotPassword();
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const onSubmit = (data) => {
    setAuthError('');
    setSuccessMsg('');
    forgotPasswordMutation.mutate(data, {
      onSuccess: (res) => {
        setSuccessMsg(res.data?.message || 'تم إرسال رابط إعادة التعيين بنجاح. يرجى التحقق من بريدك الإلكتروني.');
      },
      onError: (error) => {
        setAuthError(error.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">استعادة كلمة المرور</h2>
      
      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {authError}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          {successMsg}
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

        <Button
          type="submit"
          className="w-full"
          isLoading={forgotPasswordMutation.isPending}
        >
          إرسال رابط إعادة التعيين
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          تذكرت كلمة المرور؟{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
};
