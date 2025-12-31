module.exports = (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true, // Can be null for system events
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        ipAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userAgent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resourceId: {
            type: DataTypes.STRING, // ID of the resource being affected (e.g., Deal ID)
            allowNull: true,
        },
        resourceType: {
            type: DataTypes.STRING, // e.g., 'Deal', 'User', 'Payment'
            allowNull: true,
        },
        context: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Context snapshot (City/Region) at time of action'
        },
        actorId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'The actual user performing the action (Delegate)'
        },
        principalId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'The user whose authority is being exercised (Owner)'
        },
        delegationId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Reference to the delegation record used (if any)'
        },
        targetType: {
            type: DataTypes.STRING,
            allowNull: true
        },
        targetId: {
            type: DataTypes.UUID,
            allowNull: true
        }
    }, {
        tableName: 'audit_logs',
        timestamps: true,
        updatedAt: false, // Immutable: No updates allowed
        hooks: {
            beforeUpdate: (record, options) => {
                throw new Error('Audit logs are immutable and cannot be updated.');
            }
        }
    });

    return AuditLog;
};
