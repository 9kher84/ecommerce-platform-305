/**
 * Mock Data for Development/Testing
 * Used when database is empty or for specific scenarios
 */

const mockRequests = [
    {
        id: 1,
        title: "طلب شراء أجهزة إلكترونية",
        description: "مطلوب شراء 50 جهاز لاب توب بمواصفات محددة",
        status: "published",
        categoryId: 1,
        category: "إلكترونيات",
        quantity: 50,
        unit: "جهاز",
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        deliveryLocation: "الرياض",
        buyerId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        quoteCount: 3
    },
    {
        id: 2,
        title: "طلب مواد بناء",
        description: "مطلوب كميات كبيرة من مواد البناء لمشروع سكني",
        status: "draft",
        categoryId: 2,
        category: "أثاث",
        quantity: 1000,
        unit: "كيس",
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        deliveryLocation: "جدة",
        buyerId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        quoteCount: 0
    }
];

const mockPublishedRequests = [
    {
        id: 1,
        title: "طلب شراء أجهزة إلكترونية",
        description: "مطلوب شراء 50 جهاز لاب توب بمواصفات محددة",
        category: "إلكترونيات",
        categoryId: 1,
        deliveryLocation: "الرياض",
        quantity: 50,
        unit: "جهاز",
        createdAt: new Date(),
        buyer: {
            id: 5,
            name: "مشتري تجريبي"
        },
        quoteCount: 3,
        status: "published"
    },
    {
        id: 3,
        title: "طلب أثاث مكاتب",
        description: "مطلوب 20 قطعة أثاث مكاتب عالي الجودة",
        category: "أثاث",
        categoryId: 2,
        deliveryLocation: "الدمام",
        quantity: 20,
        unit: "قطعة",
        createdAt: new Date(),
        buyer: {
            id: 7,
            name: "مشتري آخر"
        },
        quoteCount: 5,
        status: "published"
    }
];

const mockQuotes = [
    {
        id: 1,
        requestId: 1,
        sellerId: 10,
        sellerName: "تاجر إلكترونيات",
        price: 2500,
        deliveryTime: "5 أيام",
        notes: "شحن مجاني",
        createdAt: new Date()
    },
    {
        id: 2,
        requestId: 1,
        sellerId: 11,
        sellerName: "متجر التقنية",
        price: 2400,
        deliveryTime: "3 أيام",
        notes: "ضمان سنتين",
        createdAt: new Date()
    }
];

module.exports = {
    mockRequests,
    mockPublishedRequests,
    mockQuotes
};
