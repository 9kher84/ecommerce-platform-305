-- Assign buyer role to buyer test users
INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
SELECT u.id, '68e5f4ab-e6b4-4465-ab85-519e069d551e', NOW(), NOW()
FROM "Users" u WHERE u.email IN ('buyer1_test@example.com','buyer2_test@example.com','restricted1_test@example.com','restricted2_test@example.com','fraud1_test@example.com')
ON CONFLICT DO NOTHING;

-- Assign seller role to seller test users
INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
SELECT u.id, 'ddae34f8-ca17-4afe-8817-e4247bd84fef', NOW(), NOW()
FROM "Users" u WHERE u.email IN ('seller1_test@example.com','seller2_test@example.com','fraud2_test@example.com')
ON CONFLICT DO NOTHING;

-- Assign admin role to admin test users
INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
SELECT u.id, '9376cea6-7cfb-4c18-9f6c-3d8f19443a0d', NOW(), NOW()
FROM "Users" u WHERE u.email IN ('admin1_test@example.com','admin2_test@example.com')
ON CONFLICT DO NOTHING;

-- Also add CREATE_REQUEST permission to buyer role and CREATE_QUOTE to seller role if missing
INSERT INTO role_permissions ("roleId", "permissionId")
VALUES ('68e5f4ab-e6b4-4465-ab85-519e069d551e', 'f21108e4-2581-4b66-bc47-acd7b05a8e05')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions ("roleId", "permissionId")
VALUES ('ddae34f8-ca17-4afe-8817-e4247bd84fef', '3d54418f-5730-4b63-ba48-0d7a5cf185c3')
ON CONFLICT DO NOTHING;

-- Verify
SELECT ur."userId", u.email, r.name as role_name FROM user_roles ur
JOIN "Users" u ON ur."userId" = u.id
JOIN "Roles" r ON ur."roleId" = r.id
WHERE u.email LIKE '%_test@example.com';
