/*
Name: library_org
Description: Return organization metadata based on information you may know (such as the org name or a user id)
 
Frodo command:
frodo script import -f library_org.js <tenant> 

Author: @gwizdala
 */


/**
* Note that Rhino ES2015 has the following engine compatibility: 
* https://mozilla.github.io/rhino/compat/engines.html
* Default function parameters and object destructuring are not supported
* It is suggested to stick to "vanilla javascript" where possible
*/

//// CONSTANTS
var REALM = {
  ALPHA: "alpha",
  BRAVO: "bravo"
};
var ORG_RELATIONSHIP = {
  MEMBER: "member",
  ADMIN: "admin",
  OWNER: "owner"
};

//// UTILITY FUNCTIONS
function getRealmFormatted(realm) {
    var realmKey = realm.toUpperCase();
    return REALM[realmKey] ? REALM[realmKey] : REALM.ALPHA;
}

function getOrgRelationshipFormatted(relationship) {
    var relationshipKey = relationship.toUpperCase();
    return ORG_RELATIONSHIP[relationshipKey] ? ORG_RELATIONSHIP[relationshipKey] : ORG_RELATIONSHIP.MEMBER;
}

function getFieldsFromAttributesArray(attributes) {
    var fields = "";
    if (attributes) {
      for (var i = 0; i < attributes.length; i++) {
        if (i > 0) {
          fields += ","; 
        }
        fields += attributes[i];
      }   
    }

    return fields;
}

//// EXPORTS

//// GETTERS ////
/**
* Returns the RDVP list of all organizations that a user is related to
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {string} uid the user id in which to find the organization
* @param {string} relationship the relationship the user has with the org(s), either "member", "admin", or "owner"
* @return {string} the list of orgs, or an empty array
*/
exports.getOrgIDsByUID = function(caller, realm, uid, relationship) {
  var idmRealm = getRealmFormatted(realm);
  var orgRelationship = getOrgRelationshipFormatted(relationship);
   
  var userOrgs = caller.openidm.query(`managed/${idmRealm}_user`, { "_queryFilter": `_id eq "${uid}"`, "_fields": `${orgRelationship}OfOrgIDs` });

  return (userOrgs && userOrgs.result && userOrgs.result[0][`${orgRelationship}OfOrgIDs`]) ? userOrgs.result[0][`${orgRelationship}OfOrgIDs`] : [];
};

/**
* Returns an object list of all organizations that a user is related to
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {string} uid the user id in which to find the organization
* @param {string} relationship the relationship the user has with the org(s), either "member", "admin", or "owner"
* @return {string} the list of orgs, or an empty array
*/
exports.getOrgsByUID = function(caller, realm, uid, relationship) {
  var idmRealm = getRealmFormatted(realm);
  var orgRelationship = getOrgRelationshipFormatted(relationship);
  var userOrgs = [];

  // Directly assigned user orgs
  var directUserOrgs = caller.openidm.query(`managed/${idmRealm}_user/${uid}/${orgRelationship}OfOrg`, { "_queryFilter": "true" });

  // @TODO: Child organizations related to the user
  if (directUserOrgs && directUserOrgs.result && directUserOrgs.result.length > 0) {
      userOrgs = directUserOrgs.result;
  }

  return userOrgs;
};

/**
* Returns metadata from an organization, searching off its name.  
* NOTE: A nested attribute should be referenced with slashes, e.g. "branding/themeId"
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {string} orgName the name of the organization to search on
* @param {array[string]} orgAttributes the attributes to retrieve from the organization. If null, will return all default attributes
* @return {object[]} the organization metadata
*/
exports.getOrgMetadataByOrgName = function(caller, realm, orgName, orgAttributes) {
    var idmRealm = getRealmFormatted(realm);
    var queryFilter = `name eq "${orgName}"`;
    var fields = getFieldsFromAttributesArray(orgAttributes);
    
    var orgsMetadata = caller.openidm.query(`managed/${idmRealm}_organization`, { 
      "_queryFilter": queryFilter,
      "_fields": fields
    }).result;

    return orgsMetadata;
}

/**
* Returns metadata from an organization, searching off its unique identifier.  
* NOTE: A nested attribute should be referenced with slashes, e.g. "branding/themeId"
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {string} orgId the ID of the organization to search on
* @param {array[string]} orgAttributes the attributes to retrieve from the organization. If null, will return all default attributes
* @return {object[]} the organization metadata
*/
exports.getOrgMetadataByOrgID = function(caller, realm, orgId, orgAttributes) {
    var idmRealm = getRealmFormatted(realm);
    var queryFilter = `_id eq "${orgId}"`;
    var fields = getFieldsFromAttributesArray(orgAttributes);
    
    var orgsMetadata = caller.openidm.query(`managed/${idmRealm}_organization`, { 
      "_queryFilter": queryFilter,
      "_fields": fields
    }).result;

    return orgsMetadata;
}

/**
* Fuzzy matches all users of a certain type for an Organization, searching off the Org's unique identifier.  
* NOTE: A nested attribute should be referenced with slashes, e.g. "branding/themeId"
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {string} orgId the ID of the organization to search on
* @param {string} relationship the relationship the user has with the org, either "member", "admin", or "owner"
* @param {string} searchValue the value that will be fuzzy matched to userName, givenName, sn, or mail of a user (starts with)
* @return {object[]} the top 100 users closest to fuzzy matching this value
*/
exports.findUsersInOrg = function(caller, realm, orgId, relationship, searchValue) {
    var idmRealm = getRealmFormatted(realm);
    var orgRelationship = `${getOrgRelationshipFormatted(relationship)}s`;
    
    var orgsMetadata = caller.openidm.query(`managed/${idmRealm}_organization/${orgId}/${orgRelationship}`, { 
      "_queryFilter": `userName sw "${searchValue}" or givenName sw "${searchValue}" or sn sw "${searchValue}" or mail sw "${searchValue}"`,
      "_fields": `_id,userName,givenName,sn,mail`,
      "_sortKeys": `userName`,
      "_pageSize": 100,
    }).result;

    return orgsMetadata;
}

/**
* Returns all organizations and their metadata  
* NOTE: A nested attribute should be referenced with slashes, e.g. "branding/themeId"
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {array[string]} orgAttributes the attributes to retrieve from the organization. If null, will return all default attributes
* @return {object[]} the organization metadata
*/
exports.getOrgsMetadata = function(caller, realm, orgAttributes) {
    var idmRealm = getRealmFormatted(realm);
    var fields = getFieldsFromAttributesArray(orgAttributes);
    
    var orgsMetadata = caller.openidm.query(`managed/${idmRealm}_organization`, { 
      "_queryId": "query-all",
      "_fields": fields
    }).result;

    return orgsMetadata;
}

/**
* Returns all organizations and their metadata by a custom query filter. Allows for bespoke organization referencing.
* NOTE: A nested attribute should be referenced with slashes, e.g. "branding/themeId"
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {array[string]} orgAttributes the attributes to retrieve from the organization. If null, will return all default attributes
* @param string query the query used to request the data.
* @return {object[]} the organization metadata
*/
exports.getOrgsMetadataByQueryFilter = function(caller, realm, orgAttributes, query) {
    var idmRealm = getRealmFormatted(realm);
    var fields = getFieldsFromAttributesArray(orgAttributes);
    
    var orgsMetadata = caller.openidm.query(`managed/${idmRealm}_organization`, { 
      "_queryFilter": query,
      "_fields": fields
    }).result;

    return orgsMetadata;
}

/**
* Returns metadata from all organizations tied to a user, searching off of the user's uid
* WARNING: Consider using an RDVP for complex nested organization structures to avoid heavy queries.
* NOTE: A nested attribute should be referenced with slashes, e.g. "branding/themeId"
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {string} uid the user id in which to find the organization
* @param {string} relationship the relationship the user has with the org(s), either "member", "admin", or "owner"
* @param {array[string]} orgAttributes the attributes to retrieve from the organization. If null, will return all default attributes
* @param {boolean} singleLevel whether or not the metadata should be returned for child relationships. default is `false` (all levels)
* @return {array[object]} the list of orgs, or an empty array
*/
exports.getOrgsMetadataByUID = function(caller, realm, uid, relationship, orgAttributes, singleLevel) {
  var idmRealm = getRealmFormatted(realm);
  var orgRelationship = getOrgRelationshipFormatted(relationship);
  var orgsMetadata = null;

  // Directly assigned user orgs
  var directUserOrgs = caller.openidm.query(`managed/${idmRealm}_user/${uid}/${orgRelationship}OfOrg`, { "_queryFilter": "true" });

  // Child organizations related to the user
  if (directUserOrgs && directUserOrgs.result && directUserOrgs.result.length > 0) {
    var directUserOrgsResult = directUserOrgs.result;
    
    // Build the query filter to pull every organization result
    var queryFilter = "";
    
    for (var i = 0; i < directUserOrgsResult.length; i++) {
        var org = directUserOrgsResult[i];
        
        if (i > 0) {
            queryFilter += " or "; 
        }
    
        queryFilter += `(_id eq "${org._refResourceId}") ${!singleLevel ? `or (parentIDs eq "${org._refResourceId}")` : ''}`;
    }
    
    var fields = getFieldsFromAttributesArray(orgAttributes);
      
    // It is guaranteed that this will contain a result
    orgsMetadata = caller.openidm.query(`managed/${idmRealm}_organization`, {
        "_queryFilter": queryFilter, 
        "_fields": fields
    }).result;
  }

  return orgsMetadata;
};

//// VALIDATORS ////
/**
* Returns whether or not a user has a relationship to an organization
* @param {this} caller (Use `this`) The parent context, used to get FR functions
* @param {string} realm the realm in which the user is located. Defaults to "alpha"
* @param {string} uid the user id in which to check
* @param {string} orgId the organization id in which to check
* @param {string} relationship the relationship the user has with the org(s), either "member", "admin", or "owner"
* @return {boolean} whether or not the user has the relationship
*/
exports.hasRelationshipWithOrg = function(caller, realm, uid, orgId, relationship) {
  var userOrgs = this.getOrgsMetadataByUID(caller, realm, uid, relationship, ["name"]);

  if (userOrgs && userOrgs.length > 0) {
      // Array.includes does not exist in RhinoScript. 
      for (var i = 0; i < userOrgs.length; i++) {
          var userOrg = userOrgs[i];
          var currOrgId = userOrg._id;
          if (currOrgId == orgId) {
              return true;
          }
      }
  }

  return false;
};