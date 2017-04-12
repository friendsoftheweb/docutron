const marked = require('marked');

marked.setOptions({
  smartypants: true
});

module.exports = {
  markdown() {
    return function(text, render) {
      return marked(render(text));
    };
  }
};
