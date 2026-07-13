import React, { useState } from 'react';
import { useAnalyzeIntake, useCreateOpportunity } from '../../hooks/queries/intakeQueries';
import { Button } from '../../components/common/Button';

export const IntakeWizard = () => {
  const [text, setText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const analyzeMutation = useAnalyzeIntake();
  const createMutation = useCreateOpportunity();

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setAnalysisResult(null);
    analyzeMutation.mutate({ text }, {
      onSuccess: (response) => {
        setAnalysisResult(response);
      }
    });
  };

  const handleCreate = () => {
    if (!analysisResult?.opportunity) return;
    
    createMutation.mutate({
      opportunity: analysisResult.opportunity,
      validationMetadata: analysisResult.validation,
      categoryId: 1 // Default sector
    }, {
      onSuccess: () => {
        setText('');
        setAnalysisResult(null);
        alert('تم إنشاء الفرصة بنجاح!');
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">المحرك الذكي (Intake Engine)</h2>
      
      <div className="mb-4">
        <label htmlFor="intake-text" className="block text-sm font-medium text-gray-700 mb-2">أدخل النص للتحليل</label>
        <textarea 
          id="intake-text"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-2 text-right">
          <Button onClick={handleAnalyze} isLoading={analyzeMutation.isPending} disabled={!text.trim()}>
            تحليل النص
          </Button>
        </div>
      </div>

      {analyzeMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          حدث خطأ أثناء التحليل: {analyzeMutation.error?.message}
        </div>
      )}

      {analysisResult && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">نتائج التحليل</h3>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {JSON.stringify(analysisResult.opportunity, null, 2)}
            </pre>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-800 mb-2">حالة التحقق:</h4>
            <div className={`p-3 rounded-md text-sm ${analysisResult.validation?.isValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {analysisResult.validation?.isValid ? 'جميع البيانات المطلوبة متوفرة' : 'هناك بيانات ناقصة، يمكن إكمالها لاحقاً'}
            </div>
            {analysisResult.validation?.missingFields?.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
                {analysisResult.validation.missingFields.map((field, idx) => (
                  <li key={idx}>ينقص: {field}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button variant="secondary" onClick={() => setAnalysisResult(null)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} isLoading={createMutation.isPending}>
              اعتماد وإنشاء
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
