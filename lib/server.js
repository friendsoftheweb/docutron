const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const ejs = require('ejs');
const marked = require('marked');
const exec = require('child_process').exec;
const glob = require('glob');
const livereload = require('livereload');

const pdfOptions = function(document, version) {
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

  const headerPath = path.join(process.cwd(), `documents/${document}/header.ejs`);
  const footerPath = path.join(process.cwd(), `documents/${document}/footer.ejs`);

  if (fs.existsSync(headerPath)) {
    options.push(`--header-html http://localhost:3000/${document}/${version}/header/html`);
  }

  if (fs.existsSync(footerPath)) {
    options.push(`--footer-html http://localhost:3000/${document}/${version}/footer/html`);
  }

  return options.join(' ');
};

const livereloadServer = livereload.createServer({
  exts: ['ejs', 'css', 'json'],
  applyCSSLive: false
});

marked.setOptions({
  smartypants: true
});

livereloadServer.watch([
  path.join(process.cwd(), 'documents'),
  path.join(process.cwd(), 'tmp/output')
]);

const app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(process.cwd(), 'tmp/output')));

function assetURL(path) {
  if (process.env.NODE_ENV !== 'production') {
    return `http://localhost:8080/${path}`;
  } else {
    return `/${path}`;
  }
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

function renderEJS(filePath, data = {}) {
  return ejs.render(fs.readFileSync(filePath).toString(), data, { filename: filePath });
}

app.get('/', function(req, res) {
  const filePath = path.join(__dirname, 'documents.ejs');
  const documentsDir = path.join(process.cwd(), 'documents');

  const documents = fs
    .readdirSync(documentsDir)
    .filter(file => fs.statSync(path.join(documentsDir, file)).isDirectory());

  res.send(
    renderEJS(filePath, {
      documents: documents
    })
  );
});

app.get('/:document', function(req, res) {
  const { document } = req.params;

  const filePath = path.join(__dirname, 'document-versions.ejs');
  const versionsDir = path.join(process.cwd(), 'documents', document, 'versions');

  const versions = fs
    .readdirSync(versionsDir)
    .filter(file => fs.statSync(path.join(versionsDir, file)).isFile())
    .map(file => file.replace('.json', ''));

  res.send(
    renderEJS(filePath, {
      document: document,
      versions: versions
    })
  );
});

app.get('/:document/:version/:section?/html', function(req, res) {
  const { document, version, section } = req.params;

  const layoutFilePath = path.join(__dirname, 'layout.ejs');
  const templateFilePath = path.join(
    process.cwd(),
    'documents',
    section ? `${document}/${section}.ejs` : `${document}/index.ejs`
  );

  getData(document, version, (error, data) => {
    if (error == null) {
      res.send(
        renderEJS(layoutFilePath, {
          assetURL,
          content: marked(
            renderEJS(templateFilePath, {
              data
            })
          )
        })
      );
    } else {
      res.send(`<code style="color: red">${error.toString()}</code>`);
    }
  });
});

app.get('/:document/:version/pdf', function(req, res) {
  const { document, version } = req.params;

  const input = `http://localhost:${app.get('port')}/${document}/${version}/html`;
  const output = path.join(process.cwd(), `tmp/output/${document}.pdf`);
  const command = `wkhtmltopdf ${pdfOptions(document, version)} ${input} ${output}`;

  console.log(`\nGenerating PDF:\n${command}`);

  exec(command, (error, stdout, stderr) => {
    res.sendFile(output);
  });
});

const server = http.createServer(app);
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);

function startServer() {
  compiler.watch({}, (err, stats) => {
    if (err || stats.hasErrors()) {
      console.log(stats.toString({ colors: true }));
    }

    console.log(
      stats.toString({
        chunks: false,
        colors: true,
        hash: false
      })
    );
  });

  server.listen(app.get('port'), function() {
    console.log('Web server listening on port ' + app.get('port'));
  });
}

module.exports = startServer;
