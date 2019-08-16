import { Meteor } from 'meteor/meteor';
const api = require('./pg-blueink-5433.js');

const express_setup = require('./express-setup.js');


Meteor.startup(() => {
  // code to run on server at startup
  express_setup();
});


Meteor.methods({
  'index': ()=>{
    return api.get_index();
  },
  'get-itemx': (o)=>{
    return api.get_itemx(o);
  }
})
