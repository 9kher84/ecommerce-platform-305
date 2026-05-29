// frontend/src/services/ownerService.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ownerClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * تسجيل دخول المالك (Bootstrap) - يستخدم في حالة الطوارئ أو الإعداد الأول
 */
export const ownerBootstrapLogin = async (ownerSecret) => {
  try {
    const response = await ownerClient.post("/api/owner/bootstrap-login", {
      ownerSecret,
    });
    if (response.data.token) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "خطأ في تسجيل دخول المالك";
  }
};

/**
 * جلب بيانات لوحة التحكم القيادية (Command Dashboard)
 */
export const getCommandData = async () => {
  try {
    const response = await ownerClient.get("/api/dashboard/command");
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "لا يمكن جلب بيانات القيادة";
  }
};

/**
 * جلب رادار المطابقة (Match Radar) للطلبات والصفقات
 */
export const getMatchRadar = async () => {
  try {
    const response = await ownerClient.get("/api/dashboard/match-radar");
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "خطأ في جلب بيانات الرادار";
  }
};

/**
 * التحقق من حالة النظام الطارئة (Emergency Kill-Switch Status)
 */
export const getSystemLockStatus = async () => {
  try {
    const response = await ownerClient.get("/api/health");
    return response.data;
  } catch (error) {
    return { status: "OFFLINE", error: error.message };
  }
};

const ownerService = {
  ownerBootstrapLogin,
  getCommandData,
  getMatchRadar,
  getSystemLockStatus,
};

export default ownerService;
