const r = /\b[A-Za-z0-9-_]{40,}\b/g;
const str1 = JSON.stringify({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVjM2YyNjgyLWZjYWItNDY2OC1hZTlkLTBjMjVhYzU3Y2ViNSIsInJvbGUiOiJidXllciIsImp0aSI6IjIxNDQyMmY2LTExOGEtNGY0Zi1iOTgzLTRmMzAzZTgxYzE0ZSIsImlhdCI6MTc4MzE5NDk5MywiZXhwIjoxNzgzNzk5NzkzfQ.07BexYyC-OnRRPjVZsKNsrf_VawlyEHTLQl1oZDLt-4" });
const str2 = JSON.stringify({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVjM2YyNjgyLWZjYWItNDY2OC1hZTlkLTBjMjVhYzU3Y2ViNSIsInJvbGUiOiJidXllciIsImp0aSI6IjIxNDQyMmY2LTExOGEtNGY0Zi1iOTgzLTRmMzAzZTgxYzE0ZSIsImlhdCI6MTc4MzE5NDk5MywiZXhwIjoxNzgzNzk5NzkzfQ.07BexYyC-OnRRPjVZsKNsrf_VawlyEHTLQl1oZDLt-4" });

console.log("Req 1 test:", r.test(str1));
console.log("Req 1 replace:", str1.replace(r, "[REDACTED]"));

console.log("Req 2 test:", r.test(str2));
console.log("Req 2 replace:", str2.replace(r, "[REDACTED]"));
