const { gql } = require("graphql-tag");

/**
 * GraphQL Schema Definition
 * تعريف جميع الأنواع والاستعلامات لـ GraphQL API
 */
const typeDefs = gql`
  scalar Date
  scalar JSON

  # نوع المستخدم
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    subscriptionTier: String
    rank: String
    isActive: Boolean
    createdAt: Date
    # العلاقات
    requests: [PurchaseRequest]
    quotes: [PriceQuote]
  }

  # نوع طلب الشراء
  type PurchaseRequest {
    id: ID!
    title: String!
    description: String
    quantity: Float
    unit: String
    status: String!
    post_type: String
    auction_type: String
    delivery_city: String
    delivery_date: Date
    fixed_price: Float
    price_range_min: Float
    price_range_max: Float
    viewCount: Int
    createdAt: Date
    updatedAt: Date
    expiresAt: Date
    # العلاقات
    buyer: User
    category: Category
    quotes: [PriceQuote]
    quoteCount: Int
    # حقول إضافية للخصوصية
    contactNumbers: [String]
    deliveryLocations: JSON
  }

  # نوع الفئة
  type Category {
    id: ID!
    name_ar: String!
    name_en: String!
    description: String
  }

  # نوع عرض السعر
  type PriceQuote {
    id: ID!
    amount: Float!
    priceType: String
    fixedPrice: Float
    priceRangeMin: Float
    priceRangeMax: Float
    status: String!
    notes: String
    technicalDetails: String
    deliveryDate: Date
    createdAt: Date
    # العلاقات
    seller: User
    request: PurchaseRequest
    # حقول إضافية (للبائعين Plan B)
    isOwnQuote: Boolean
    isWinner: Boolean
  }

  # نوع الصفقة
  type Deal {
    id: ID!
    status: String!
    finalPrice: Float
    deliveryStatus: String
    createdAt: Date
    completedAt: Date
    # العلاقات
    buyer: User
    seller: User
    request: PurchaseRequest
    quote: PriceQuote
  }

  # نوع ملخص لوحة التحكم
  type DashboardSummary {
    totalRequests: Int!
    activeRequests: Int!
    totalQuotes: Int!
    pendingQuotes: Int!
    completedDeals: Int!
    totalSpent: Float!
    totalEarned: Float!
  }

  # الاستعلامات المتاحة
  type Query {
    # استعلامات المستخدم
    userFullProfile(id: ID!): User
    me: User

    # استعلامات طلبات الشراء
    requestDetails(id: ID!): PurchaseRequest
    myRequests(status: String): [PurchaseRequest]
    allRequests(categoryId: ID, status: String, limit: Int): [PurchaseRequest]

    # استعلامات عروض الأسعار
    myQuotes(requestId: ID): [PriceQuote]
    requestQuotes(requestId: ID!): [PriceQuote]

    # استعلامات لوحة التحكم
    dashboardSummary: DashboardSummary
    recentRequests(limit: Int): [PurchaseRequest]
    recentQuotes(limit: Int): [PriceQuote]

    # استعلامات الصفقات
    myDeals(status: String): [Deal]
    dealDetails(id: ID!): Deal
  }
`;

module.exports = { typeDefs };
