// Inside your webpack.config.js file

module.exports = {
  // ... other configurations like 'entry', 'output', 'module' ...

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'] // Add this line
  },

  // ... other configurations ...
};