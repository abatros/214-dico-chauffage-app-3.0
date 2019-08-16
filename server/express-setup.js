"strict mode"

const assert = require('assert');
import express from 'express';
import bodyParser from 'body-parser';
const jsrender = require('jsrender');

const api = require('./pg-blueink-5433.js');
const parse_md = require('../lib/parse_md.js');

const setup = function(){

  /*
  SSR.compileTemplate('browse', Assets.getText('page.html'));
  Template.browse.helpers({
    getDocType: function() {
      return "<!doctype html>";
    }
  });
  */

  SSR.compileTemplate('article', Assets.getText('article.html'));
  Template.article.helpers({
    getDocType: function() {
      return "<!doctype html>";
    }
  });

/*
  SSR.compileTemplate('page', Assets.getText('page.html'));
  Template.page.helpers({
    getDocType: function() {
      return "<!doctype html>";
    }
  });
*/


  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));


  // Set JsRender as the template engine for Express - for .html files
  app.engine('html', jsrender.__express);
  app.set('view engine', 'html');

  // Specify folder location for storing JsRender templates for Express
  app.set('views', __dirname + '/js-render-templates');

  app.all('/static', function(req, res, next) {
  //  res.header("Access-Control-Allow-Origin", "*");
  //  res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
   });

   app.use('/static', express.static(__dirname + '/public'))

   /*
   app.get('/robots', require('./robots.js').robots);
   app.get('/reset', require('./reset.js').reset);
//   app.get('/article/:id', require('./article.js').get_article);

   app.get('/sitemap.txt', require('./sitemap.js').get_sitemap);
   */

   app.get('/mktoc',(req,res)=>{
     fs.writeFile('/www/museum/test.txt','/www/museum.test.txt',(err)=>{
       res.status(200).send(`mktoc done err:${err}`)
     });
   })


   app.get('/sitemap.txt',(req,res)=>{
     const etime = new Date().getTime();
     api.sitemap_index()
     .then(data => {
       res.setHeader('content-type', 'text/plain');
       res.status(200).send(data.join('\n'));
     })
     .catch(err => {
       res.status(200).send(`err:${err}`)
     })
   })



  /*

  // --------------------------------------------------------------------------

  app.get('/', require('./index.js').index);
  //app.get('/', (req,res)=>{
  //  res.sendFile(__dirname + '/templates/index.html');
  //});




  */

/*
  app.get('/api', (req, res) => {
    var html = SSR.render('browse', {
      css: 'body {}',
      template: "browse",
      data: {}
    });
    //res.end(html);
    //res.status(200).json({ message: 'Hello World!!! ' + new Date()});
    res.status(200).end(html);
  });
*/

  app.get('/page/:id', (req, res) => {
//    const v = req.params.id.split(/^([0-9]*)/)
    const v = req.params.id.match(/^([0-9]*)/)
    console.log('v:(%s)=>',req.params.id,v);
//    Meteor.call('get-itemx',{item_id:v[0]},(err,data)=>{

    Meteor.call('get-itemx',{item_id:v[1]},(err,data)=>{
      if (err) throw err;
      try {
        console.log('data.row:',data.row);
        if (!data.row.item_id) {
          res.status(404).end('article not found');
          return;
        }
        const a = parse_md(data.row.description);
        /*
        var html = SSR.render('article', {row:a});
//        res.status(200).end(html);
//        res.render('article.html',{html:html});
        res.status(200).end(SSR.render('page',{
          html:html
        }));
        */
        res.status(200).end(SSR.render('article',{row:a}));
      }
      catch(err) {
        res.status(404).end('system error-112: '+err);
      }
    });
  });


  WebApp.connectHandlers.use(app);
}


module.exports = setup;
