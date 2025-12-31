# Rate Limit Strategy and Remediation
**Date:** 2025-12-09  
**Status:** ✅ Implemented

---

## 🎯 Problem Statement
During initial Performance Baseline testing (P2.1), we observed a **90%+ error rate** (429 Too Many Requests). This blocked our ability to measure the actual throughput capacity of the application server and database, as requests were being rejected at the middleware layer.

---

## 🛠️ Remediation Strategy

### decision: Environment-Aware Limits
We have modified the `rateLimitMiddleware.js` to be aware of the `NODE_ENV`.

### Configuration Matrix
| Environment | API Limit (15m) | Login Limit (5m) | Purpose |
|-------------|-----------------|------------------|---------|
| **Production** | 100 | 5 | Strict security & DDoS protection |
| **Development** | 1000 | 100 | Developer convenience |
| **Test** | **100,000** | **100,000** | **Unrestricted Load Testing** |

### Implementation Details
A helper function `getMaxRequests` was introduced to centralize this logic:
```javascript
const getMaxRequests = (prodLimit, devLimit) => {
    if (process.env.NODE_ENV === 'test') return 100000;
    if (process.env.NODE_ENV === 'production') return prodLimit;
    return devLimit;
};
```

---

## ⚠️ Risk & Mitigation

**Risk:** Using `test` config in production could expose the system.
**Mitigation:** `NODE_ENV` is strictly controlled in deployment pipelines. Production servers are hardcoded to ignore `test` settings or deployed with `NODE_ENV=production`.

---

## 📈 Expected Impact on Baseline 2.0
We expect the next baseline run (`perf:baseline`) to show:
- **Error Rate:** < 1% (from >90%)
- **Throughput:** Significant increase (reflecting true server capacity)
- **Latency:** Accurate measurement of DB/App overhead, not 429 rejection speed.
