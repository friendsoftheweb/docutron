# Docutron

In an empty directory:

```
$ yarn init
$ yarn add https://github.com/friendsoftheweb/docutron.git
```

Directory structure:

<pre>
assets
├── styles
|   └── index.scss
├── images
└── fonts

documents
└── proposals
    ├── index.hbs
    ├── header.hbs
    ├── footer.hbs
    ├── cover.hbs
    └── versions
        ├─ lexcorp.json
        └─ wayne-enterprises.json
</pre>

Starting the server:

```
$ yarn run docutron
```

## Dependencies

Requires version 0.12.5 of [wkhtmltopdf](https://wkhtmltopdf.org/)
