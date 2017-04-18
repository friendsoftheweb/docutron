const path = require('path');
const fs = require('fs');
const glob = require('glob');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');

const helpers = require('./helpers');

const WORKING_DIRECTORY = process.cwd();

function documents() {
  const documentsDir = path.join(WORKING_DIRECTORY, 'documents');

  return fs
    .readdirSync(documentsDir)
    .filter(file => fs.statSync(path.join(documentsDir, file)).isDirectory() && file !== 'shared');
}

function getData(document, version, callback) {
  const versionsPath = path.join(WORKING_DIRECTORY, 'documents', document, 'versions');
  const jsonDataPath = path.join(versionsPath, `${version}.json`);
  const yamlDataPath = path.join(versionsPath, `${version}.yml`);
  let data = {};

  if (fs.existsSync(jsonDataPath)) {
    data = JSON.parse(fs.readFileSync(jsonDataPath, 'utf8'));
  } else if (fs.existsSync(yamlDataPath)) {
    data = yaml.safeLoad(fs.readFileSync(yamlDataPath, 'utf8'));
  }

  callback(null, data);
}

function wkhtmltopdfCommand(host, document, version) {
  let input = [`page ${host}/${document}/${version}.html`];

  const coverPath = path.join(WORKING_DIRECTORY, `documents/${document}/cover.hbs`);

  if (fs.existsSync(coverPath)) {
    input.unshift(`cover ${host}/${document}/${version}/cover.html`);
  }

  input = input.join(' ');

  const output = path.join(WORKING_DIRECTORY, `tmp/output/${document}.pdf`);

  let options = [
    '--page-size Letter',
    '--margin-top 20mm',
    '--margin-right 20mm',
    '--margin-bottom 30mm',
    '--margin-left 20mm',
    '--disable-smart-shrinking',
    '--zoom 3.12',
    '--print-media-type',
    '--no-stop-slow-scripts',
    '--javascript-delay 2500'
  ];

  const headerPath = path.join(WORKING_DIRECTORY, `documents/${document}/header.hbs`);
  const footerPath = path.join(WORKING_DIRECTORY, `documents/${document}/footer.hbs`);

  if (fs.existsSync(headerPath)) {
    options.push(`--header-html http://localhost:3000/${document}/${version}/header.html`);
  }

  if (fs.existsSync(footerPath)) {
    options.push(`--footer-html http://localhost:3000/${document}/${version}/footer.html`);
  }

  options = options.join(' ');

  return `wkhtmltopdf ${options} ${input} ${output}`;
}

function renderTemplate(filePath, data = {}) {
  const templateString = fs.readFileSync(filePath).toString();
  const partials = {};

  glob.sync(path.join(WORKING_DIRECTORY, 'documents/shared/**/*.hbs')).forEach(partialPath => {
    const key = partialPath
      .replace(path.join(WORKING_DIRECTORY, 'documents/shared/'), '')
      .replace('.hbs', '');

    partials[key] = fs.readFileSync(partialPath).toString();
  });

  Handlebars.registerHelper(helpers);
  Handlebars.registerPartial(partials);

  const template = Handlebars.compile(templateString);

  return template(data);
}

function versionsForDocument(document) {
  const versionsDir = path.join(WORKING_DIRECTORY, 'documents', document, 'versions');

  return fs
    .readdirSync(versionsDir)
    .filter(file => fs.statSync(path.join(versionsDir, file)).isFile())
    .map(file => file.replace(/\.(json|yml)$/, ''));
}

module.exports = { documents, getData, wkhtmltopdfCommand, renderTemplate, versionsForDocument };
