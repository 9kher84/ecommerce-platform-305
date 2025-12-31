import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminFloatingToolbar = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // Only show for admins/owner
    if (!user || (!user.isAdmin && user.role !== 'owner')) return null;

    const toggleEditMode = () => {
        // Toggle a global class or context
        document.body.classList.toggle('admin-edit-mode');
        // Dispatch visual feedback or toast
        alert('Edit Mode Toggled (Visual Only for now)');
    };

    return (
        <div className="fixed bottom-6 left-6 z-50">
            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-900 text-white p-4 rounded-full shadow-2xl hover:bg-gray-800 transition-all transform hover:scale-110"
                title="Admin Tools"
            >
                👑
            </button>

            {/* Menu */}
            {isOpen && (
                <div className="absolute bottom-16 left-0 bg-white rounded-lg shadow-xl border border-gray-200 w-64 overflow-hidden animate-fade-in-up">
                    <div className="p-3 bg-gray-50 border-b font-bold text-gray-700 flex justify-between items-center">
                        <span>أدوات المشرف</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">v1.0</span>
                    </div>

                    <div className="p-2 space-y-1">
                        <button
                            onClick={toggleEditMode}
                            className="w-full text-right p-2 hover:bg-gray-50 rounded text-sm text-gray-700 flex items-center gap-2"
                        >
                            ✏️ وضع التعديل المباشر
                        </button>

                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="w-full text-right p-2 hover:bg-gray-50 rounded text-sm text-gray-700 flex items-center gap-2"
                        >
                            📊 لوحة التحكم
                        </button>

                        <button
                            onClick={() => navigate('/admin/users')}
                            className="w-full text-right p-2 hover:bg-gray-50 rounded text-sm text-gray-700 flex items-center gap-2"
                        >
                            👥 إدارة المستخدمين
                        </button>

                        <div className="h-px bg-gray-100 my-1"></div>

                        <button
                            className="w-full text-right p-2 hover:bg-red-50 rounded text-sm text-red-600 flex items-center gap-2"
                        >
                            🗑️ تنظيف الكاش
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFloatingToolbar;
