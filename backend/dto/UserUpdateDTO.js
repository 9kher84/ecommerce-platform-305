class UserUpdateDTO {
    constructor(data) {
        this.originalData = data;
        this.allowedFields = [
            'name',
            'phone',
            'address',
            'language',
            'theme'
            // Excludes: email (requires verify), password, role, subscriptionTier
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

        // Strict: If illegal fields are present, we might want to flag/error?
        // For now, we return sanitized data.
        return {
            valid: true,
            sanitizedData: validatedData,
            illegalFields
        };
    }
}

module.exports = UserUpdateDTO;
