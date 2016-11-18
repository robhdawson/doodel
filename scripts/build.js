'use strict';

const path = require('path');
const commandLineArgs = require('command-line-args');

const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const watch = require('metalsmith-watch');
const assets = require('metalsmith-assets');
const serve = require('metalsmith-pretty-serve');
const sass = require('metalsmith-sass');
const webpack = require('ms-webpack');
const sassTypes = require('node-sass').types;

const options = commandLineArgs([
    {name: 'dev', type: Boolean},
    {name: 'publish', type: Boolean},
]);

// Publish prefix - project name if published on github pages,
// blank for dev (or published to real domain)
let prefix = '';
let shouldWatch = false;
let buildpath = path.resolve(__dirname, '../build/dev');

if (options.dev) {
    shouldWatch = true;
}

if (options.publish) {
    prefix = '/boilerboy';
    buildpath = path.resolve(__dirname, '../build/prod');
}

const app = Metalsmith(__dirname)
.metadata({
    title: "Boilerboy",
    description: "I'm boilerboy!",
    prefix: prefix,
})
.use(webpack({
    context: path.resolve(__dirname, '../src/js/'),
    entry: {
        index: './index.js',
    },
    output: {
        path: buildpath,
        publicPath: prefix,
        filename: 'js/[name].js',
    },
}))
.source(path.resolve(__dirname, '../src'))
.destination(buildpath)
.ignore('js')
.use(sass({
    outputStyle: 'compressed',
    functions: {
        'asset-url($path)': function(p) {
            return new sassTypes.String(`url(${prefix}/assets/${p.getValue()})`);
        },
    },
}))
.use(assets({
    source: '../src/assets',
    destination: './assets',
}))
.use(layouts({
    director: path.resolve(__dirname, '../layouts'),
    engine: 'handlebars',
    default: path.resolve(__dirname, '../layouts/main.handlebars'),
    pattern: '*.handlebars',
    rename: true,
    cache: false,
}));

if (shouldWatch) {
    app.use(watch({
        paths: {
            '${source}/**/*.handlebars': true,
            'layouts/**/*': '**/*',
            '${source}/styles/**/*': 'styles/**/*',
            '${source}/js/**/*': 'js/**/*',
        },
    }))
    .use(serve());
}

app.build(function(err, files) {
    if (err) {
        throw err;
    }

    console.log('Built!');
});
