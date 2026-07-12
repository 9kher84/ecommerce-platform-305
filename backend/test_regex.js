const pattern = /\b[A-Za-z0-9-_]{40,}\b/g;
const str = JSON.stringify({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVjM2YyNjgyLWZjYWItNDY2OC1hZTlkLTBjMjVhYzU3Y2ViNSIsInJvbGUiOiJidXllciIsImp0aSI6IjIxNDQyMmY2LTExOGEtNGY0Zi1iOTgzLTRmMzAzZTgxYzE0ZSIsImlhdCI6MTc4MzE5NDk5MywiZXhwIjoxNzgzNzk5NzkzfQ.07BexYyC-OnRRPjVZsKNsrf_VawlyEHTLQl1oZDLt-4" });
console.log("Original:", str);
console.log("Test:", pattern.test(str));
console.log("Replace:", str.replace(pattern, "[REDACTED]"));
