const TP = Template.subIndex_panel;

TP.helpers({
  max_height:()=>{
    return Session.get('article-id')?'10px;':'';
  },
  overflow:()=>{
    return Session.get('article-id')?'hidden;':'';
  }
})
