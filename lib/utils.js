const path = require('path');
const fs = require('fs');
const glob = require('glob');
const Mustache = require('mustache');

const helpers = require('./helpers');

function documents() {
  const documentsDir = path.join(process.cwd(), 'documents');

  return fs
    .readdirSync(documentsDir)
    .filter(file => fs.statSync(path.join(documentsDir, file)).isDirectory());
}

function getData(document, version, callback) {
  const dataPath = path.join(process.cwd(), 'documents', document, 'versions', `${version}.json`);

  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath));

    callback(null, data);
  } else {
    callback(null, {});
  }
}

function wkhtmltopdfCommand(host, document, version) {
  let input = [`page ${host}/${document}/${version}.html`];

  const coverPath = path.join(process.cwd(), `documents/${document}/cover.mustache`);

  if (fs.existsSync(coverPath)) {
    input.unshift(`cover ${host}/${document}/${version}/cover.html`);
  }

  input = input.join(' ');

  const output = path.join(process.cwd(), `tmp/output/${document}.pdf`);

  let options = [
    '--page-size Letter',
    '--margin-top 20mm',
    '--margin-right 20mm',
    '--margin-bottom 30mm',
    '--margin-left 20mm',
    '--disable-smart-shrinking',
    '--zoom 3.12',
    '--print-media-type'
  ];

  const headerPath = path.join(process.cwd(), `documents/${document}/header.mustache`);
  const footerPath = path.join(process.cwd(), `documents/${document}/footer.mustache`);

  if (fs.existsSync(headerPath)) {
    options.push(`--header-html http://localhost:3000/${document}/${version}/header.html`);
  }

  if (fs.existsSync(footerPath)) {
    options.push(`--footer-html http://localhost:3000/${document}/${version}/footer.html`);
  }

  options = options.join(' ');

  return `wkhtmltopdf ${options} ${input} ${output}`;
}

function renderTemplate(filePath, view = {}) {
  const template = fs.readFileSync(filePath).toString();
  const partials = {};

  glob.sync(path.join(process.cwd(), 'documents/shared/**/*.mustache')).forEach(partialPath => {
    const key = partialPath
      .replace(path.join(process.cwd(), 'documents/shared/'), '')
      .replace('.mustache', '');

    partials[key] = fs.readFileSync(partialPath).toString();
  });

  view = Object.assign({}, helpers, view);

  return Mustache.render(template, view, partials);
}

function versionsForDocument(document) {
  const versionsDir = path.join(process.cwd(), 'documents', document, 'versions');

  return fs
    .readdirSync(versionsDir)
    .filter(file => fs.statSync(path.join(versionsDir, file)).isFile())
    .map(file => file.replace(/\.json$/, ''));
}

module.exports = { documents, getData, wkhtmltopdfCommand, renderTemplate, versionsForDocument };
