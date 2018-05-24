module.exports = {
  testMatch: ["<rootDir>/test/**/*.js"],
  transform: {
    "^.+\\.(js|jsx)$": "<rootDir>/node_modules/babel-jest"
  }
};
