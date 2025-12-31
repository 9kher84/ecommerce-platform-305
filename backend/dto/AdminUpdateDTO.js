class AdminUpdateDTO {
    constructor(data) {
        this.originalData = data;
        this.allowedFields = [
            'name',
            'email',
            'role',
            'isActive',
            'adminPermissions', // Only specific admins might touch this, but generic admin DTO allows it
            'adminStatus'
        ];
    }

    validate() {
        const validatedData = {};
        const illegalFields = [];

        Object.keys(this.originalData).forEach(key => {
            if (this.allowedFields.includes(key)) {
                validatedData[key] = this.originalData[key];
            } else {
                illegalFields.push(key);
            }
        });

        return {
            valid: true, // We strip illegal fields rather than failing, or we could fail. Strict DTO usually fails.
            sanitizedData: validatedData,
            illegalFields: illegalFields
        };
    }
}

module.exports = AdminUpdateDTO;
