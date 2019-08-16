const app = require('./api-client.js');

Session.set('bh-ready',false);


Template.registerHelper('session',(key) => {
  return Session.get(key);
});


Template.registerHelper('db_row',() => {
  return app.db_row.get();
});


Template.registerHelper('index',() => {
  return app.index.list();
});


Template.registerHelper('subIndex',() => {
  return app.subIndex.get();
});

Template.registerHelper('subIndex_count',() => {
  const si = app.subIndex.get();
  if (si && si.length > 0) {
    Session.set('show-intro',false)
    return si.length;
  }
});

Template.registerHelper('subIndex_cursor',() => {
  const si = app.subIndex_cursor.get();
  if (si >= 0) return si+1;
});


Session.set('show-intro',true);
Template.registerHelper('show_intro',() => {
  return Session.get('show-intro');
});

//--  only reactive vars.
Template.registerHelper('app',(x) => {
  return app[x].get();
});
