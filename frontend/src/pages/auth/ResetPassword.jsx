import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useResetPassword } from '../../hooks/queries/authQueries';

export const ResetPassword = () => {
  const { token } = useParams();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const resetPasswordMutation = useResetPassword();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const password = watch('password');

  const onSubmit = (data) => {
    setAuthError('');
    setSuccessMsg('');
    resetPasswordMutation.mutate({ token, password: data.password }, {
      onSuccess: (res) => {
        setSuccessMsg(res.data?.message || 'تمت إعادة تعيين كلمة المرور بنجاح.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      },
      onError: (error) => {
        setAuthError(error.message || 'حدث خطأ. قد يكون الرابط غير صالح أو منتهي الصلاحية.');
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">تعيين كلمة مرور جديدة</h2>
      
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
          id="password"
          label="كلمة المرور الجديدة"
          type="password"
          {...register('password', { 
            required: 'كلمة المرور مطلوبة',
            minLength: {
              value: 8,
              message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
            }
          })}
          error={errors.password?.message}
          autoComplete="new-password"
        />

        <Input
          id="confirmPassword"
          label="تأكيد كلمة المرور"
          type="password"
          {...register('confirmPassword', { 
            required: 'يرجى تأكيد كلمة المرور',
            validate: value => value === password || 'كلمات المرور غير متطابقة'
          })}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={resetPasswordMutation.isPending}
        >
          حفظ كلمة المرور
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
};
