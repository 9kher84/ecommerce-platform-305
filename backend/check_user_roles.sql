SELECT ur.*, u.email FROM user_roles ur JOIN "Users" u ON ur."userId" = u.id WHERE u.email LIKE '%_test@example.com';
