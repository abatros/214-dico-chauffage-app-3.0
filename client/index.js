const api = require('./api-client.js');

const TP = Template.index;

TP.onCreated(function(){
  api.load_index();
})


TP.helpers({
  index_visibility:()=>{
    return Session.get('article-id')?'hidden':'';
  },
  index_max_height:()=>{
    return Session.get('article-id')?'10px':'';
  }
})

TP.events({
  'input .js-typeahead': (e,tp)=>{
    //tp.clear_messages();
    const value = e.target.value;
    if (value.startsWith('##')) {
      console.log('> list-all index.length:',app.index.length);
      app.subIndex.set(app.index.array());
      //app.subIndex_timeStamp.set(new Date().getTime());
      console.log('> list-all subIndex.length:',app.subIndex.length);
      return false;
    }

    if (value.length < 3) {
      return false;
    }
//      tp.cc_list = asearch(e.target.value);

    /*
    let _searchText = normalize(value.replace(/[,:;\+\(\)\-\.]/g,' '));
    Session.set('actual-search-text',_searchText);
    */

    api.bh_search(value) // => subIndex - ONLY used here.
    .then(si =>{
      console.log('subIndex.length:',si.length);
    })
    .catch(err =>{
      console.log('bh-search err:',err);
    })
    return false;
  }
});
