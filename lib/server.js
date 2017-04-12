const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const exec = require('child_process').exec;
const livereload = require('livereload');
const ejs = require('ejs');

const { documents, getData, pdfOptions, renderTemplate, versionsForDocument } = require('./utils');

const livereloadServer = livereload.createServer({
  exts: ['mustache', 'css', 'json'],
  applyCSSLive: false
});

livereloadServer.watch([
  path.join(process.cwd(), 'documents'),
  path.join(process.cwd(), 'tmp/output')
]);

const app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(process.cwd(), 'tmp/output')));

app.get('/', function(req, res) {
  const filePath = path.join(__dirname, 'documents.ejs');
  const template = fs.readFileSync(filePath).toString();

  res.send(
    ejs.render(template, {
      documents: documents()
    })
  );
});

app.get('/:document', function(req, res) {
  const { document } = req.params;

  const filePath = path.join(__dirname, 'document-versions.ejs');
  const template = fs.readFileSync(filePath).toString();
  const versions = versionsForDocument(document);

  res.send(
    ejs.render(template, {
      document: document,
      versions: versions
    })
  );
});

app.get('/:document/:version/:section?.html', function(req, res) {
  const { document, version, section } = req.params;

  const layoutFilePath = path.join(__dirname, 'layout.ejs');
  const layoutTemplate = fs.readFileSync(layoutFilePath).toString();
  const templateFilePath = path.join(
    process.cwd(),
    'documents',
    section ? `${document}/${section}.mustache` : `${document}/index.mustache`
  );

  getData(document, version, (error, data) => {
    if (error == null) {
      res.send(
        ejs.render(layoutTemplate, {
          content: renderTemplate(templateFilePath, data)
        })
      );
    } else {
      res.send(`<code style="color: red">${error.toString()}</code>`);
    }
  });
});

app.get('/:document/:version.pdf', function(req, res) {
  const { document, version } = req.params;

  const input = `http://localhost:${app.get('port')}/${document}/${version}.html`;
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
