// You can add utility functions here for any repeated logic,
// such as formatting data, generating random identifiers, etc.

const formatResponse = (data, message) => {
  return {
    success: true,
    message,
    data,
  };
};

module.exports = { formatResponse };