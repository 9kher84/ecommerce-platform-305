// ملف معطل - Redis غير متوفر
module.exports = {
  startWorker: () => console.log("🚫 Worker disabled - Redis unavailable"),
  setupQueue: () => console.log("🚫 Queue disabled - Redis unavailable"),
  startSchedulerWorker: () =>
    console.log("🚫 Scheduler disabled - Redis unavailable"),
  setupRepeatedJobs: () =>
    console.log("🚫 Repeated jobs disabled - Redis unavailable"),
  startNotificationWorker: () =>
    console.log("🚫 Notification worker disabled - Redis unavailable"),
  startDealWorker: () =>
    console.log("🚫 Deal worker disabled - Redis unavailable"),
  getQueue: () => null,
};
return;

// الكود الأصلي معطل أدناه
