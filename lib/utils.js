const path = require('path');
const fs = require('fs');
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

function pdfOptions(document, version) {
  const options = [
    '--page-size Letter',
    '--margin-top 20mm',
    '--margin-right 20mm',
    '--margin-bottom 50mm',
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

  return options.join(' ');
}

function renderTemplate(filePath, view = {}, partials = {}) {
  const template = fs.readFileSync(filePath).toString();

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

module.exports = { documents, getData, pdfOptions, renderTemplate, versionsForDocument };
