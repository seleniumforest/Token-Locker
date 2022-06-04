const MockedToken = artifacts.require("MockedToken");

module.exports = async function(_deployer) {
  _deployer.deploy(MockedToken);
};
