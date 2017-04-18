const marked = require('marked');
const Handlebars = require('handlebars');

marked.setOptions({
  smartypants: true
});

module.exports = {
  markdown(options) {
    return new Handlebars.SafeString(marked(options.fn(this)));
  }
};
