const assert = require('assert');
const api = require('./api-client.js');

const TP = Template.topMenu;


TP.helpers({
  cursor_info() {
    const max = api.subIndex.get().length;
    const i = Session.get('subIndex-cursor');
    return `${i+1}:${max}`;
  },

})

TP.events({
  'click .js-index': (e,tp)=>{
    //clear_messages();
    console.log('click');
    FlowRouter.go('index');
    return false;
  }
});

TP.events({
  'click .js-next': (e,tp)=>{
    //clear_messages();
    const next = api.next_article();
    // advance cursor, return ref to next-article
    assert (next, 'fatal');
    FlowRouter.setParams({id: next.id});
    return false;
  },
  'click .js-prev': (e,tp)=>{
    //clear_messages();
    const ix = api.prev_article();
    // advance cursor, return ref to next-article
    assert (ix, 'fatal');
    FlowRouter.setParams({id: ix.id});
    return false;
  }
});
