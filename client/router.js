const api = require('./api-client.js');
const assert = require('assert');



FlowRouter.route('/', { name: 'index',
  action: function(params, queryParams){
    console.log('Router::action for: ', FlowRouter.getRouteName());
    console.log(' --- params:',params);
    document.title = "dico-chauffage 3.0";
//    BlazeLayout.render('index');
    Session.set('article-id',null);
  }
});

FlowRouter.route('/article/:id', { name: 'article',
    action: function(params, queryParams){
        console.log('Router::action for: ', FlowRouter.getRouteName());
        console.log(' --- params:',params);
//        Meteor.publibase_dataset_Key.set('cc');
//        document.title = "chauffage";
//        BlazeLayout.render('article');
      Session.set('article-id', params.id);
    }
});
