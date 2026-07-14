/**
 * LegacyUserMapper
 * 
 * A pure function utility to maintain backward compatibility for the Frontend.
 * It takes a User object (usually an instance from Sequelize or a plain object)
 * and an Organization object, and merges them so that the frontend still receives
 * `businessName` and `commercialRegister` as top-level properties on the user.
 * 
 * Priority: 
 * If the Organization object exists and has these fields, they OVERRIDE 
 * any legacy values that might still be sitting in the User object.
 */

function mapLegacyUser(user, organization) {
  if (!user) return null;

  // Convert Sequelize instances to plain objects if needed
  const userData = user.toJSON ? user.toJSON() : { ...user };
  const orgData = organization ? (organization.toJSON ? organization.toJSON() : { ...organization }) : null;

  if (orgData) {
    // Shadow Migration Priority: Organization fields take precedence
    userData.businessName = orgData.name || userData.businessName;
    userData.commercialRegister = orgData.commercial_registration || userData.commercialRegister;
    
    // Also include the raw organization data if the frontend ever decides to use it natively
    userData.organization = orgData;
  }

  // Ensure sensitive data is not leaked (though authController usually handles this, we do a safety check)
  if (userData.password) delete userData.password;

  return userData;
}

module.exports = {
  mapLegacyUser
};
