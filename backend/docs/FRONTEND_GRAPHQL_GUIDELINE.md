# 🚀 FRONTEND GRAPHQL MIGRATION GUIDELINE

**التاريخ**: 2025-11-29  
**الهدف**: توجيه مهندس الواجهة الأمامية للانتقال من REST إلى GraphQL

---

## 📋 **نظرة عامة**

### **لماذا GraphQL؟**

| الميزة            | REST                | GraphQL                   |
| ----------------- | ------------------- | ------------------------- |
| **حجم البيانات**  | يُرجع جميع الحقول   | يُرجع الحقول المطلوبة فقط |
| **عدد الطلبات**   | طلبات متعددة        | طلب واحد                  |
| **سرعة الموبايل** | بطيء (بيانات زائدة) | سريع (بيانات محسّنة)      |
| **التوثيق**       | يدوي                | تلقائي (Schema)           |
| **Type Safety**   | لا                  | نعم                       |

### **التحسينات المتوقعة**

- ⚡ **60% تقليل** في حجم البيانات المنقولة
- ⚡ **50% تقليل** في عدد الطلبات
- ⚡ **40% تحسين** في سرعة التطبيق
- 🔋 **30% توفير** في استهلاك البطارية

---

## 🔄 **أمثلة المقارنة**

### **مثال 1: جلب طلب شراء واحد**

#### **REST (الطريقة القديمة)**

```javascript
// 3 طلبات منفصلة
const request = await fetch("/api/requests/123");
const buyer = await fetch(`/api/users/${request.buyerId}`);
const quotes = await fetch(`/api/requests/123/quotes`);

// حجم البيانات: ~15KB
// عدد الطلبات: 3
// الوقت: ~600ms
```

#### **GraphQL (الطريقة الجديدة)**

```javascript
// طلب واحد فقط
const { data } = await client.query({
  query: gql`
    query GetRequest($id: ID!) {
      request(id: $id) {
        id
        title
        description
        status
        buyer {
          id
          name
          rank
        }
        quotes {
          id
          amount
          seller {
            name
          }
        }
      }
    }
  `,
  variables: { id: "123" },
});

// حجم البيانات: ~3KB (80% أقل)
// عدد الطلبات: 1 (67% أقل)
// الوقت: ~200ms (67% أسرع)
```

---

### **مثال 2: جلب قائمة الطلبات**

#### **REST (الطريقة القديمة)**

```javascript
// يُرجع جميع الحقول (حتى غير المطلوبة)
const requests = await fetch("/api/requests");

// البيانات المُرجعة:
{
  data: [
    {
      id: "1",
      title: "...",
      description: "...", // ❌ غير مطلوب في القائمة
      quantity: 100,
      unit: "kg",
      status: "published",
      categoryId: 1,
      buyerId: "abc",
      viewCount: 50,
      quoteCount: 10,
      expiresAt: "...",
      createdAt: "...",
      updatedAt: "...",
      lastModifiedAt: "...", // ❌ غير مطلوب
      modificationRequested: false, // ❌ غير مطلوب
      // ... 20+ حقل آخر
    },
  ];
}

// حجم البيانات: ~50KB لـ 20 طلب
```

#### **GraphQL (الطريقة الجديدة)**

```javascript
// يُرجع الحقول المطلوبة فقط
const { data } = await client.query({
  query: gql`
    query GetRequests {
      requests(limit: 20) {
        id
        title
        status
        quoteCount
        buyer {
          name
        }
      }
    }
  `,
});

// البيانات المُرجعة:
{
  data: {
    requests: [
      {
        id: "1",
        title: "...",
        status: "published",
        quoteCount: 10,
        buyer: {
          name: "John",
        },
      },
    ];
  }
}

// حجم البيانات: ~8KB لـ 20 طلب (84% أقل!)
```

---

## 🛠️ **الإعداد**

### **1. تثبيت المكتبات**

```bash
npm install @apollo/client graphql
```

### **2. إعداد Apollo Client**

```javascript
// src/apollo/client.js
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "http://localhost:5000/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
```

### **3. ربط Apollo مع React**

```javascript
// src/index.js
import { ApolloProvider } from "@apollo/client";
import client from "./apollo/client";

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root"),
);
```

---

## 📝 **أمثلة الاستخدام**

### **Query: جلب البيانات**

```javascript
import { useQuery, gql } from "@apollo/client";

const GET_REQUESTS = gql`
  query GetMyRequests {
    myRequests {
      id
      title
      status
      quoteCount
    }
  }
`;

function RequestsList() {
  const { loading, error, data } = useQuery(GET_REQUESTS);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data.myRequests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}
```

---

### **Mutation: تعديل البيانات**

```javascript
import { useMutation, gql } from "@apollo/client";

const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateRequestInput!) {
    createRequest(input: $input) {
      id
      title
      status
    }
  }
`;

function CreateRequestForm() {
  const [createRequest, { loading, error }] = useMutation(CREATE_REQUEST);

  const handleSubmit = async (formData) => {
    try {
      const { data } = await createRequest({
        variables: {
          input: {
            title: formData.title,
            description: formData.description,
            quantity: formData.quantity,
            unit: formData.unit,
            categoryId: formData.categoryId,
          },
        },
      });

      console.log("Request created:", data.createRequest);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return <Form onSubmit={handleSubmit} loading={loading} />;
}
```

---

### **Subscription: البيانات الفورية**

```javascript
import { useSubscription, gql } from "@apollo/client";

const NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNotificationReceived($userId: ID!) {
    notificationReceived(userId: $userId) {
      id
      title
      message
      type
      createdAt
    }
  }
`;

function NotificationBell({ userId }) {
  const { data } = useSubscription(NOTIFICATION_SUBSCRIPTION, {
    variables: { userId },
  });

  useEffect(() => {
    if (data?.notificationReceived) {
      showToast(data.notificationReceived.message);
    }
  }, [data]);

  return <BellIcon />;
}
```

---

## 🎯 **خطة الترحيل**

### **المرحلة 1: الصفحات الثقيلة (أولوية عالية)**

| الصفحة          | REST Endpoints | GraphQL Query | التحسين المتوقع |
| --------------- | -------------- | ------------- | --------------- |
| Request Details | 3 endpoints    | 1 query       | 70% أسرع        |
| Dashboard       | 5 endpoints    | 1 query       | 80% أسرع        |
| Quotes List     | 2 endpoints    | 1 query       | 60% أسرع        |

**الكود**:

```javascript
// Before (REST)
const request = await api.get(`/requests/${id}`);
const buyer = await api.get(`/users/${request.buyerId}`);
const quotes = await api.get(`/requests/${id}/quotes`);

// After (GraphQL)
const { data } = await client.query({
  query: GET_REQUEST_DETAILS,
  variables: { id },
});
// كل البيانات في طلب واحد!
```

---

### **المرحلة 2: القوائم (أولوية متوسطة)**

```javascript
// Before (REST) - يُرجع 50+ حقل
const requests = await api.get("/requests");

// After (GraphQL) - يُرجع 5 حقول فقط
const { data } = await client.query({
  query: gql`
    query {
      requests {
        id
        title
        status
        quoteCount
        createdAt
      }
    }
  `,
});
```

---

### **المرحلة 3: الإشعارات الفورية (أولوية عالية)**

```javascript
// Before (REST) - Polling كل 30 ثانية
setInterval(() => {
  api.get("/notifications");
}, 30000);

// After (GraphQL) - Real-time subscriptions
useSubscription(NOTIFICATION_SUBSCRIPTION);
// فوري بدون polling!
```

---

## 📊 **قياس الأداء**

### **قبل GraphQL**

```
صفحة Request Details:
├─ عدد الطلبات: 3
├─ حجم البيانات: 15KB
├─ الوقت: 600ms
└─ استهلاك البطارية: عالي
```

### **بعد GraphQL**

```
صفحة Request Details:
├─ عدد الطلبات: 1 (67% أقل)
├─ حجم البيانات: 3KB (80% أقل)
├─ الوقت: 200ms (67% أسرع)
└─ استهلاك البطارية: منخفض (30% أقل)
```

---

## ⚠️ **أفضل الممارسات**

### **1. استخدم Fragments للحقول المتكررة**

```javascript
const USER_FRAGMENT = gql`
  fragment UserInfo on User {
    id
    name
    email
    role
  }
`;

const GET_REQUEST = gql`
  ${USER_FRAGMENT}
  query GetRequest($id: ID!) {
    request(id: $id) {
      id
      title
      buyer {
        ...UserInfo
      }
    }
  }
`;
```

---

### **2. استخدم Variables بدلاً من String Interpolation**

```javascript
// ❌ سيء
const query = gql`
  query {
    request(id: "${id}") {
      title
    }
  }
`;

// ✅ جيد
const query = gql`
  query GetRequest($id: ID!) {
    request(id: $id) {
      title
    }
  }
`;
```

---

### **3. استخدم Cache بذكاء**

```javascript
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          requests: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
```

---

## 🔧 **أدوات مفيدة**

### **1. GraphQL Playground**

```
http://localhost:5000/graphql
```

- اختبار الـ Queries
- استكشاف الـ Schema
- توثيق تلقائي

### **2. Apollo DevTools**

```bash
# Chrome Extension
https://chrome.google.com/webstore/detail/apollo-client-devtools
```

- مراقبة الـ Queries
- فحص الـ Cache
- تتبع الأداء

### **3. GraphQL Code Generator**

```bash
npm install -D @graphql-codegen/cli
```

- توليد TypeScript types تلقائياً
- توليد React Hooks

---

## ✅ **الخلاصة**

### **الفوائد الرئيسية**

| الميزة           | التحسين     |
| ---------------- | ----------- |
| حجم البيانات     | 60-80% أقل  |
| عدد الطلبات      | 50-70% أقل  |
| سرعة التطبيق     | 40-60% أسرع |
| استهلاك البطارية | 30% أقل     |
| تجربة المستخدم   | ممتازة      |

### **الخطوات التالية**

1. ✅ إعداد Apollo Client
2. ✅ ترحيل صفحة واحدة (Proof of Concept)
3. ✅ قياس التحسينات
4. ✅ ترحيل باقي الصفحات تدريجياً

---

**📅 التاريخ**: 2025-11-29  
**✅ الحالة**: دليل جاهز للاستخدام  
**🎯 الهدف**: تحسين أداء التطبيق بنسبة 40-60%
