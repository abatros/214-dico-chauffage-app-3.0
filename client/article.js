const api = require('./api-client.js')

const TP = Template.article;

TP.helpers({
  row: ()=>{
    return api.db_row.get();
  }
})

TP.events({
  'click .js-va, click .js-vr': (e,tp)=>{
    console.log('lookup for <%s>',e.currentTarget.text.toLowerCase().trim());
    const ae = api.index_find(e.currentTarget.text.toLowerCase().trim());
    if (ae) {
      FlowRouter.setParams({id:ae.id});
      return;
    }
    console.log('ALERT NOT FOUND.')
    return false;
  }
})
