import React, { useState, useEffect, useCallback, useMemo } from "react";
// استخدام مكتبة Lucide Icons لأيقونات الويب
import {
  LayoutDashboard,
  Users,
  Tag,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Home,
  User,
  Bell,
  BarChart3,
  Search,
} from "lucide-react";
import AdminDashboard from "./src/components/admin/AdminDashboard";
import AdminFloatingToolbar from "./src/components/admin/AdminFloatingToolbar";

// تهيئة Firebase
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  setLogLevel,
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  getDocs,
  addDoc,
} from "firebase/firestore";

// البيانات العالمية (مفترضة من بيئة التشغيل)
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const firebaseConfig = JSON.parse(
  typeof __firebase_config !== "undefined" ? __firebase_config : "{}",
);
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : "";
const API_BASE_URL = "http://localhost:5000/api/v1";

// ----------------------------------------------------------------------
// 1. وظائف مساعدة عامة
// ----------------------------------------------------------------------

const getImageUrl = (text) =>
  `https://placehold.co/100x100/F9FAFB/111827?text=${encodeURIComponent(text)}`;

const apiFetch = async (endpoint, options = {}) => {
  console.log(`[API MOCK] Fetching: ${API_BASE_URL}${endpoint}`);
  await new Promise((resolve) => setTimeout(resolve, 300)); // محاكاة التأخير

  // محاكاة لبيانات الإحصائيات فقط (تم استبدال المنشورات بـ Firestore)
  if (endpoint.startsWith("/stats/summary")) {
    return {
      success: true,
      count: 8,
      total: 8,
      activePosts: 8,
      offers: 8,
      sellers: 1,
    };
  }

  return { success: true, data: {} };
};

// ----------------------------------------------------------------------
// 2. إدارة الحالة الأساسية (Firebase, Auth, Context)
// ----------------------------------------------------------------------

const AppContext = React.createContext();

const AppProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // ⚠️ حالة التوجيه المخصصة: تم إضافة selectedPostId
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedPostId, setSelectedPostId] = useState(null);

  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // 🆕 دالة التوجيه للتفاصيل
  const navigateToPostDetails = useCallback((postId) => {
    setSelectedPostId(postId);
    setCurrentPage("postDetails");
  }, []);

  // 🆕 دالة العودة إلى الرئيسية
  const navigateToHome = useCallback(() => {
    setSelectedPostId(null);
    setCurrentPage("home");
  }, []);

  useEffect(() => {
    try {
      setLogLevel("debug");
      const firebaseApp = initializeApp(firebaseConfig);
      const authInstance = getAuth(firebaseApp);
      const dbInstance = getFirestore(firebaseApp);

      setAuth(authInstance);
      setDb(dbInstance);

      if (initialAuthToken) {
        signInWithCustomToken(authInstance, initialAuthToken)
          .then(() => console.log("Firebase signed in with custom token."))
          .catch((error) => {
            console.error(
              "Custom token sign-in failed. Signing in anonymously.",
              error,
            );
            signInAnonymously(authInstance);
          });
      } else {
        signInAnonymously(authInstance).catch(console.error);
      }

      const unsubscribe = onAuthStateChanged(authInstance, (authUser) => {
        if (authUser) {
          setUserId(authUser.uid);

          // محاكاة دور المدير إذا كان الـ uid يبدأ بـ 'admin'
          const role = authUser.uid.startsWith("admin")
            ? "super_admin"
            : "buyer";
          setUser({
            id: authUser.uid,
            email:
              authUser.email || `${authUser.uid.substring(0, 8)}@example.com`,
            role: role,
          });

          // Mock JWT for admin API use (if needed later)
          if (role === "super_admin" && !localStorage.getItem("jwt")) {
            const mockAdminJwt = ""; // Removed for security
            localStorage.setItem("jwt", mockAdminJwt);
          }
        } else {
          setUserId(null);
          setUser(null);
          localStorage.removeItem("jwt");
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase Initialization Error:", error);
      setIsAuthReady(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      db,
      auth,
      userId,
      user,
      isAuthReady,
      currentPage,
      setCurrentPage,
      selectedPostId,
      navigateToPostDetails,
      navigateToHome, // 🆕 التوجيه الجديد
      notification,
      showNotification,
      appId,
    }),
    [
      db,
      auth,
      userId,
      user,
      isAuthReady,
      currentPage,
      notification,
      showNotification,
      selectedPostId,
      navigateToPostDetails,
      navigateToHome,
      appId,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useAppContext = () => React.useContext(AppContext);

// ----------------------------------------------------------------------
// 3. مكونات واجهة المستخدم (UI Components) + المكونات الجديدة (Mock)
// ----------------------------------------------------------------------

// 3.1. مكون الإشعار العائم (NotificationBar)
const NotificationBar = ({ message, type, onClose }) => {
  if (!message) return null;

  const baseClasses =
    "fixed bottom-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-2xl z-50 flex items-center space-x-3 rtl:space-x-reverse transition-opacity duration-300";
  let typeClasses = "";
  let Icon = CheckCircle;

  switch (type) {
    case "error":
      typeClasses = "bg-red-600 text-white";
      Icon = AlertTriangle;
      break;
    case "warning":
      typeClasses = "bg-yellow-400 text-gray-900";
      Icon = AlertTriangle;
      break;
    case "success":
    default:
      typeClasses = "bg-green-500 text-white";
      Icon = CheckCircle;
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      <Icon className="w-6 h-6 ml-3 rtl:mr-3" />
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// 3.2. مكون التمرير الجانبي (Sidebar)
const Sidebar = ({ onNavigate }) => {
  const { user, currentPage } = useAppContext();
  const isSuperAdmin = user?.role === "super_admin";

  const navItems = [
    { id: "home", label: "الرئيسية (للتصفح)", icon: Home },
    // 🆕 إضافة رابط Admin Dashboard للمسؤولين فقط
    ...(isSuperAdmin
      ? [{ id: "admin", label: "لوحة تحكم المدير", icon: LayoutDashboard }]
      : []),

    { id: "dashboard", label: "لوحة التحكم الخاصة", icon: LayoutDashboard }, // لوحة تحكم البائع/المشتري
    { id: "posts", label: "إدارة المنشورات", icon: Plus },
    { id: "offers", label: "العروض والمبيعات", icon: ChevronRight },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-full fixed top-0 right-0 p-4 pt-16 z-30">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
            }}
            className={`w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg transition duration-150 ${
              currentPage === item.id ||
              (currentPage === "postDetails" && item.id === "home")
                ? "bg-indigo-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <item.icon className="w-5 h-5 ml-3" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// 3.3. مكون المودال (Modal) - (بقي كما هو)
const Modal = ({ children, title, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[1000] p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// 3.4. مكون لوحة التحكم العادية (Dashboard) - (بقي كما هو)
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between transition duration-300 hover:shadow-xl">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <div className="p-3 rounded-full bg-gray-100">{icon}</div>
  </div>
);

const PlaceholderChart = ({ label }) => (
  <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg w-full md:w-56 h-40 bg-gray-50">
    <p className="text-gray-400 text-sm">{label}</p>
    <div className="w-full h-16 bg-gray-200 rounded-md mt-2 flex items-end justify-around p-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-4 bg-indigo-400 rounded-t-sm"
          style={{ height: `${(i + 1) * 20}%` }}
        ></div>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-2">بيانات وهمية</p>
  </div>
);

const Dashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        مرحباً بك في لوحة التحكم
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المستخدمين"
          value="1,200"
          icon={<Users className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="المنشورات النشطة"
          value="350"
          icon={<Plus className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="العروض المقدمة"
          value="5,800"
          icon={<ChevronRight className="w-6 h-6 text-yellow-500" />}
        />
        <StatCard
          title="التصنيفات"
          value="15"
          icon={<Tag className="w-6 h-6 text-red-500" />}
        />
      </div>
      <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          ملخص النشاط
        </h2>
        <p className="text-gray-600">
          هنا سيتم عرض الرسوم البيانية والملخصات الخاصة بالنشاط اليومي
          والأسبوعي.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <PlaceholderChart label="منشورات اليوم" />
          <PlaceholderChart label="إحصائيات المبيعات" />
        </div>
      </div>
    </div>
  );
};

// 3.5. مكون بطاقة المنشور (PostCard)
const PostCard = ({ post }) => {
  const { navigateToPostDetails } = useAppContext();

  const handleViewDetails = () => {
    navigateToPostDetails(post.id);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
      <h2 className="text-lg font-semibold text-gray-800 truncate">
        {post.title || "عنوان المنشور"}
      </h2>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
        {post.description || "وصف مختصر..."}
      </p>
      <div className="mt-3 flex justify-between items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {post.category || "عام"}
        </span>
        <span className="text-xl font-bold text-green-600">
          {post.price || 0} ج.م
        </span>
      </div>
      <button
        onClick={handleViewDetails}
        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-150"
      >
        عرض التفاصيل
      </button>
    </div>
  );
};

// 3.6. مكون الصفحة الرئيسية (HomePage) - (مُعدّل لاستخدام Firestore)
const HomePage = () => {
  const { db, isAuthReady, showNotification, appId } = useAppContext();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({});

  // دالة إضافة بيانات وهمية في حال كانت المجموعة فارغة
  const seedInitialData = useCallback(
    async (db, appId) => {
      if (!db || !appId) return;

      try {
        const postsCollectionRef = collection(
          db,
          `artifacts/${appId}/public/data/posts`,
        );
        const snapshot = await getDocs(postsCollectionRef);

        if (snapshot.empty) {
          console.log("Seeding initial posts...");
          const mockData = [
            {
              title: "حاسوب محمول للألعاب - الإصدار الأحدث",
              description:
                "بطاقة رسومية قوية، 32 جيجابايت رام. مثالي للمحترفين.",
              category: "إلكترونيات",
              price: 5500,
              createdAt: Date.now() - 10000,
            },
            {
              title: "خدمة تصميم هوية بصرية شاملة",
              description: "تصميم شعار، ألوان، وخطوط للشركات الناشئة.",
              category: "خدمات",
              price: 800,
              createdAt: Date.now() - 5000,
            },
            {
              title: "هاتف ذكي جديد - شاشة OLED",
              description: "كاميرا فائقة الدقة وبطارية تدوم ليومين.",
              category: "إلكترونيات",
              price: 1200,
              createdAt: Date.now() - 15000,
            },
            {
              title: "طاولة طعام خشبية فاخرة",
              description: "خشب طبيعي 100%، تتسع لـ 8 أشخاص، بتصميم عصري.",
              category: "أثاث",
              price: 900,
              createdAt: Date.now() - 25000,
            },
            {
              title: "دروس لغة إنجليزية مكثفة",
              description: "مدرس معتمد بخبرة 10 سنوات. مستويات متعددة.",
              category: "تعليم",
              price: 300,
              createdAt: Date.now() - 35000,
            },
          ];
          for (const data of mockData) {
            await addDoc(postsCollectionRef, data);
          }
          showNotification(
            "تم إضافة بيانات وهمية للمتجر. قد تحتاج إلى إعادة التحميل لرؤيتها.",
            "warning",
          );
        }
      } catch (e) {
        console.error("Error seeding data:", e);
      }
    },
    [appId, showNotification],
  );

  const loadData = useCallback(async () => {
    if (!db) return;

    setIsLoading(true);

    // 1. محاولة إضافة بيانات وهمية إذا كانت المجموعة فارغة
    await seedInitialData(db, appId);

    try {
      // 2. جلب المنشورات من Firestore باستخدام onSnapshot
      const postsCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/posts`,
      );

      const unsubscribe = onSnapshot(
        postsCollectionRef,
        (snapshot) => {
          const fetchedPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // فرز في الذاكرة حسب حقل "createdAt" وتحديد العدد بـ 8
          const sortedPosts = fetchedPosts
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 8);

          setPosts(sortedPosts);
          setIsLoading(false);
        },
        (error) => {
          console.error("Firestore Snapshot Error (HomePage):", error);
          showNotification(`خطأ في جلب المنشورات: ${error.message}`, "error");
          setIsLoading(false);
        },
      );

      // 3. جلب الإحصائيات من API الوهمي (تظل كما هي)
      const statsResult = await apiFetch("/stats/summary");
      if (statsResult.success)
        setStats({
          activePosts: statsResult.activePosts || 8,
          offers: statsResult.offers || 8,
          sellers: statsResult.sellers || 1,
        });

      return () => unsubscribe(); // تنظيف المستمع عند إزالة المكون
    } catch (error) {
      console.error("خطأ عام في جلب بيانات الصفحة الرئيسية:", error);
      showNotification(`خطأ عام: ${error.message}`, "error");
      setIsLoading(false);
    }
  }, [db, appId, seedInitialData, showNotification]);

  useEffect(() => {
    if (isAuthReady && db) {
      // ضمان جلب البيانات بعد أن يصبح كل من Auth وDB جاهزين
      return loadData();
    }
  }, [isAuthReady, db, loadData]);

  const statItems = [
    { label: "منشور نشط", value: stats.activePosts || 8 },
    { label: "عروض اقتصادية", value: stats.offers || 8 },
    { label: "بائع نشط", value: stats.sellers || 1 },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-lg flex justify-between items-center border-b-4 border-indigo-500"
          >
            <div>
              <p className="text-lg font-medium text-gray-500">{item.label}</p>
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-500" />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن منتجات، خدمات، أو بائعين..."
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          />
          <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        اكتشف أحدث المنشورات
      </h2>

      {isLoading ? (
        <div className="text-center p-10 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 ml-3" />
          <p className="text-lg text-gray-600">جاري تحميل المنشورات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="col-span-4 text-center text-gray-500 p-10 bg-white rounded-xl shadow">
              لا توجد منشورات حاليًا. سيتم إضافة بيانات تجريبية تلقائيًا.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// 3.7. مكون تفاصيل المنشور (PostDetailsPage) - (مُعدّل لاستخدام Firestore)
const PostDetailsPage = () => {
  const { db, appId, selectedPostId, navigateToHome, showNotification } =
    useAppContext();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedPostId || !db) {
      // في حال عدم وجود معرف أو قاعدة بيانات جاهزة، لا تفعل شيئًا
      return;
    }

    setIsLoading(true);
    console.log(`Fetching details for Post ID: ${selectedPostId}`);

    // مرجع الوثيقة: /artifacts/{appId}/public/data/posts/{selectedPostId}
    const postDocRef = doc(
      db,
      `artifacts/${appId}/public/data/posts`,
      selectedPostId,
    );

    const unsubscribe = onSnapshot(
      postDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPost({
            id: docSnap.id,
            ...docSnap.data(),
          });
        } else {
          console.error(`Post with ID ${selectedPostId} not found.`);
          showNotification("لم يتم العثور على المنشور المطلوب.", "error");
          navigateToHome(); // العودة إلى الرئيسية في حال عدم العثور على المنشور
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore Snapshot Error (PostDetails):", error);
        showNotification(`خطأ في جلب التفاصيل: ${error.message}`, "error");
        setIsLoading(false);
      },
    );

    return () => unsubscribe(); // تنظيف المستمع عند إزالة المكون
  }, [selectedPostId, db, appId, navigateToHome, showNotification]);

  if (!selectedPostId) {
    // هذه الحالة يجب أن يعالجها navigateToHome() بالفعل، لكنها كإجراء احتياطي
    return null;
  }

  if (isLoading || !post) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="mr-3 text-lg text-gray-600">
          جاري جلب تفاصيل المنشور...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl">
      <button
        onClick={navigateToHome}
        className="text-indigo-600 hover:text-indigo-800 flex items-center mb-6 font-medium"
      >
        <ChevronRight className="w-5 h-5 ml-1" /> العودة إلى الرئيسية
      </button>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
        {post.title || "عنوان غير متوفر"}
      </h1>
      <div className="text-sm text-gray-500 mb-6 border-b pb-4 flex items-center space-x-4 rtl:space-x-reverse">
        <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
          {post.category || "غير مصنف"}
        </span>
        <span className="flex items-center">
          <User className="w-4 h-4 ml-1" /> البائع:{" "}
          {post.seller || "بائع افتراضي"}
        </span>
      </div>

      <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-line">
        {post.description || "لا يوجد وصف مفصل لهذا المنشور حاليًا."}
      </p>

      <div className="bg-gray-100 p-6 rounded-xl flex justify-between items-center shadow-inner border border-gray-200">
        <span className="text-3xl font-bold text-red-600">
          السعر: {post.price || 0} ج.م
        </span>
        <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition transform hover:scale-105 shadow-md">
          تقديم عرض
        </button>
      </div>
    </div>
  );
};

// 3.8 AdminDashboard imported from external file

const App = () => {
  const {
    isAuthReady,
    currentPage,
    setCurrentPage,
    notification,
    showNotification,
    user,
  } = useAppContext();

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="text-xl text-indigo-600 mr-3">
          جاري تهيئة النظام...
        </span>
      </div>
    );
  }

  // 🆕 تحديد المكون بناءً على حالة التوجيه
  let ContentComponent;
  let showSidebar = true;

  const isSuperAdmin = user?.role === "super_admin";

  switch (currentPage) {
    case "home":
      ContentComponent = HomePage;
      showSidebar = true;
      break;
    case "postDetails":
      ContentComponent = PostDetailsPage;
      showSidebar = false; // لا يظهر الشريط الجانبي في صفحة التفاصيل
      break;
    case "admin":
      if (isSuperAdmin || user?.isAdmin) {
        ContentComponent = AdminDashboard;
        showSidebar = true; // يمكن عرضه مع لوحة تحكم المدير
      } else {
        ContentComponent = Dashboard;
        showNotification(
          "ليس لديك صلاحية الوصول إلى لوحة تحكم المسؤول.",
          "error",
        );
        setCurrentPage("dashboard");
      }
      break;
    case "dashboard": // مسار لوحة تحكم المستخدم/البائع
    case "posts": // مسار إدارة المنشورات
    case "offers": // مسار العروض
    default:
      ContentComponent = Dashboard;
      break;
  }

  const userGreeting =
    user?.role === "super_admin" ? "المدير" : user?.id ? "المستخدم" : "ضيف";
  const userIdDisplay = user?.id
    ? `(${user.id.substring(0, 8)})`
    : "(غير مسجل)";

  return (
    <div dir="rtl" className="flex bg-gray-100 min-h-screen">
      <NotificationBar
        message={notification?.message}
        type={notification?.type}
        onClose={() => showNotification(null)}
      />

      {showSidebar && <Sidebar onNavigate={setCurrentPage} />}

      <div className={`${showSidebar ? "mr-64" : ""} w-full pt-16`}>
        {/* Header (شريط التنقل العلوي) */}
        <header
          className={`fixed top-0 right-0 ${showSidebar ? "w-[calc(100%-16rem)]" : "w-full"} bg-white shadow-md z-40 p-4 flex justify-between items-center rtl:border-r border-gray-200`}
        >
          <div className="text-lg font-semibold text-gray-700">
            منصة التجارة الإعلانية
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <span className="text-sm text-gray-500 ml-3">
              مرحباً، {userGreeting} {user?.id}
            </span>
          </div>
        </header>

        <main className="p-4">
          <ContentComponent />
        </main>
        <AdminFloatingToolbar user={user} />
      </div>
    </div>
  );
};

// تغليف التطبيق بمزود السياق
const RootApp = () => (
  <AppProvider>
    <App />
  </AppProvider>
);

export default RootApp;
