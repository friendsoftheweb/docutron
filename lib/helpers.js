const marked = require('marked');
const Handlebars = require('handlebars');
const { isEmpty } = Handlebars.Utils;

marked.setOptions({
  smartypants: true
});

module.exports = {
  markdown(options) {
    return new Handlebars.SafeString(marked(options.fn(this)));
  },

  eq(left, right) {
    return left === right;
  },

  'not-eq': function(left, right) {
    return left !== right;
  },

  not(value) {
    return !isEmpty(value);
  },

  and(left, right) {
    return !(isEmpty(left) || isEmpty(right));
  },

  or(left, right) {
    return !(isEmpty(left) && isEmpty(right));
  },

  lt(left, right) {
    return left < right;
  },

  lte(left, right) {
    return left <= right;
  },

  gt(left, right) {
    return left > right;
  },

  gte(left, right) {
    return left >= right;
  }
};
