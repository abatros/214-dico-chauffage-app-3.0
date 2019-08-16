const assert = require('assert');
const Bloodhound = require('bloodhound-js');
const removeAccents = require('remove-accents')
const yaml = require('js-yaml');

import { ReactiveDict } from 'meteor/reactive-dict';

/*
  article_id : control display, either index or article
  Router sets immediately that value.
  Hoping no article has (item_id === 0)
*/
export const index = new ReactiveArray();
export const subIndex = new ReactiveVar();

export const db_row = new ReactiveVar();
//export const bh_ready = new ReactiveVar(null);

//export const search_columns = new ReactiveArray();

export const alert = new ReactiveVar();
export const warning = new ReactiveVar();
export const show_intro = new ReactiveVar('true');

// --------------------------------------------------------------------------

Tracker.autorun(()=>{
  const ai = Session.get('article-id');
  console.log('article-id:=',ai);
  if (!ai) {
    db_row.set(null);
    return;
  }
  get_itemx(ai)
  .then(data => {
    console.log('data:',data);
    db_row.set(data);
    if (subIndex.get() && subIndex.get().length > 0) {
      const i = subIndex.get().findIndex((d,i) => {
          return d.id == ai;
      });
      Session.set('subIndex-cursor',i);
    }
  })
  .catch(err => {
    console.log('err:',err);
  })
})

// --------------------------------------------------------------------------

const marked = require('marked');
//const marked = require('kramed');

marked.setOptions({
//  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false, // do not generate a break at new line.
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});

var renderer = new marked.Renderer();

renderer.image = function(url, title, alt){
  console.log('-- img : (%s)(%s)(%s)',url,title,alt);
//  flag_cit = false;

  // add <p> if in BI.

  // fixing URL
  if (!url.startsWith('http')) {
    url = 'http://dico-chauffage.ultimheat.com/images/' + url;
  }
/*
  return '<div style="text-align:center; width:100%">'
    +'<img  style="display:bloc; max-width:100%;" src="' + url
    +'" alt="' + alt
    +'" title="' + title
    +'" />\n</div>\n';
*/


    return `<img class="3.14" style="display:block; margin: 0 auto; max-width:100%; max-height:200pt;"
    src="${url}" alt="alt-${alt}" title="ti-${title}">
    `;
};

renderer.blockquote = function(text){
//  return text.replace(/<p>/g, '<p class="citation">');
//  r_Mode = 'cit';
  console.log('CITATION:',text);
  text = text.replace(/\(([^\)]*)\)<\/p>/g,'&ensp;&ndash;&ensp;<a href="#" class="refc">$1</a>')
  return '<blockquote>\n' + text + '</blockquote>\n';
};

// --------------------------------------------------------------------------

const mk_ts = function(h){
  h = h //.replace(/::/g,' ') // au,vr,va will be removed later
    .toLowerCase()
    .replace(/['\(\)\-\.]/g,' ')
    .replace(/ {2,}/g, ' ');

  var uniq = [ ...new Set(removeAccents(h).split(' ')) ];
  // latinize... ?
  let v = uniq.filter((it)=>{
    it = it.trim();
    return (it.length > 2);
  });
  return v.join(' ');
};


export function load_index() {
  Meteor.call('index',(err,data)=>{
    if (err) throw err;
    console.log('data.rows.length:',data.rows.length);
    //index.set(data.rows);
    data.rows.forEach(it=>{
//      console.log('-- ',it)

      // let's build ts_vector
      const o = {
        id: it.item_id,
        h1: it.h1,
      }
      const v = [it.h1];
      if (it.vr) {
        v.push(it.vr); o.vr = it.vr;
      }
      if (it.va && (it.va.length > 0)) {
        v.push(it.va.join(' ')); o.va = it.va;
      }
      if (it.au && (it.au.length > 0)) {
        v.push(it.au.join(' ')); o.au = it.au;
      }

      o.ts = mk_ts(v.join(' ')); // also remove accents.

      index.push(o); // entry
      // populate BH.
    })
    return bh_init(); // operates on api.index.
  })
}

export function load_index2(rows) {
  const etime = new Date().getTime();
  index.clear();
  rows.forEach(it =>{
    /*
    it.pic = nor(it.pic || '');
    it.reserved = (it.flag && it.flag == 'R'); // RESERVE
    it.mk = it.mk && JSON.parse(it.mk).sort();
//      console.log('it.mk (%d):',it.mk.length,it.mk);
    if(it.mk && (it.mk.length <= 0)) it.mk = null;
    if (it.mk) {
      it.mk2 = it.mk && it.mk.join(' ').toLowerCase();
    }
//    if (it.flag == 'R') {
//      r_counter += 1;
//    } else {
      //it.ts_vector = mk_ts1(it);
      //console.log(' -- ts_vector:',it.ts_vector);
      index.push(it);
//    }
    */
    index.push();
  });
  console.log('load_index %d items took:%d ms.',
      rows.length, new Date().getTime()- etime);
}

// --------------------------------------------------------------------------

const bh_engine = new Bloodhound({ // only used here in index.
      local: [], //[{name:'dog'}, {name:'pig'}, {name:'moose'}],
      init: false,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      datumTokenizer: function(d) {
        return Bloodhound.tokenizers.whitespace(d.ts); // normalized
      }
    }); // engine


export function bh_init() {
  return bh_engine.initialize()
  .then(function() {
    console.log('> bh-engine (re)init done - adding index length:',index.array().length);
    bh_engine.add(index.array());
//    console.log('> bh_engine.index.datums:',bh_engine.index.datums)
    console.log('> bh_engine.index.datums.length:',bh_engine.index.datums.length)
    Session.set('bh-ready',true);
    return Promise.resolve(true);
  }); // promise
};


// ---------------------------------------------------------------------

export function bh_search(value){
  const searchText = removeAccents(value).replace(/[,:;\+\(\)\-\.]/g,' ');
  console.log('bh_search(%s)',searchText);

//  Session.set('actual-search-text',_searchText);
  const s_time = new Date().getTime();
//console.log('xowiki bh_search <%s>',s);
//  const engine = Modules.pb.bh_engine;
  if (!bh_engine) {
    console.log('ALERT BH-engine not ready.');
//    Session.set('ui-warning', '45DA12:: BH-engine not ready')
    return Promise.reject('ALERT BH-engine not ready.');
  }

  //Session.set('subIndex-cursor',0);

  return new Promise((resolve,reject)=>{
    bh_engine.search(searchText,
    function(d) { // success
      console.log('bh_search => ', d.length);
      subIndex.set(d);
      if (d.length <= 0) {
        console.log('> subIndex is empty');
        console.log(bh_engine.index.datums);
      }
      resolve(d);
    },
    function(d) { // error
      console.log('ERROR:',d);
      subIndex.set(null);
      reject(d);
    });
  }); // promise
} // bh_search

// --------------------------------------------------------------------------
/*
    used by va, vr
    find entry in index with matchin h1
*/

export function index_find(s) {
  s = s.trim().toLowerCase();
  const ix = index.array().find(it => (it.h1.toLowerCase() === s));
  console.log('ix:',ix);
  return ix;
}

// -------------------------------------------------------------------

function get_subIndex_cursor(){
  const v = subIndex.get();
  const ai = article_id.get();

  if (!v || v.length <= 0 || !ai) {
    subIndex_cursor.set(undefined)
    return -1;
  }

  let si = subIndex_cursor.get();
  if ((typeof si == 'undefined')||(!v[si])||(v[si].id !== ai)) {
    si = v.findIndex(it=>{return (it.id == ai);})
    if ((si < 0)||(si >= v.length)) {
      subIndex_cursor.set(undefined)
      return -1; // error current is not in subIndex.
    }

    subIndex_cursor.set(si);
  }

  return si;
}



export function next_article(){ // in selection
  const v = subIndex.get();
  if (!v || v.length <= 0) {
    return null;
  }

  let si = Session.get('subIndex-cursor') + 1;
  if (si >= v.length) si = 0;
  Session.set('subIndex-cursor',si);
  return v[si];
}; // next-article

export function prev_article(){
  const v = subIndex.get();
  if (!v || v.length <= 0) {
    return null;
  }

  let si = Session.get('subIndex-cursor') - 1;
  if (si < 0) si = v.length-1;
  Session.set('subIndex-cursor',si);
  return v[si];
}; // prev-article

// ----------------------------------------------------------------
/*
  {
    id:
    ti: // classment
    h1: // from #
    vr:
    au: []
    va: []
    pic: [{fn,caption}]
    md:
  }
*/

function repack(row) {
  const o = {
    id: row.id,
    au: [], va: [], pics:[]
  }

  o.h1 = row.headline.split('::', 1);
  /*
  row.headline.split('::').forEach((it,j)=>{
    if (j < 1) {
      o.h1 = it; return;
    }
    const v2 = it.split(' ',2);
    console.log('v2:',v2)
    switch(v2[0]) {
      case 'vr': o.vr = it; break;
      case 'va': o.va.push(v2[1]); break;
      case 'au': o.au.push(v2[1]); break;
      default: throw 'invalid opCode1:'+v2[0];
    }
  });
  */

  // convert body to MD and extract pics
  const v = [];
  row.body.forEach(it =>{
    switch(it.class) {
      case 'cit': v.push('>'
          + it.text.join('\n>')
            .replace(/<dots>/g,'...')
            .replace(/\{ref:\(\)([^\}]*)\}/g,'&ndash;&nbsp;<a class="refc" href="#">$1</a>')
          + '\n\n\n');
          break;

      case 'img':
        it.text = it.text.filter(it=>(it.trim().length > 0)).join('<br>\n');
        o.pics.push(it);
        break;
      case 'intro': v.push(it.text.join('\n\n')); break;
      case 'va': o.va = it.items.map(it=>it.text); break;
      case 'vr': case 'au': break; // ignore
      default: throw 'invalid opCode2:'+it.class;
    }
  })
  o.md = v.join('\n');

  // next is render HTML. ++ head and pics

/*
  const html = [`<h1>${o.h1}</h1>`];
  o.va.forEach(it =>{
    html.push(`<p>${it}</p>`)
  });
    +
*/
  o.html = marked(o.md, { renderer: renderer }); //renderer.render(o.md);
  return o;
}


function format(s) {
  return s.replace(/{nl}/g,'<br>')
    .replace(/{ref}(.*)\n/g,'&ensp;&mdash;&ensp;<span>$1</span>')
    .replace(/\n>/g,'\n\n>') //!!
}

function repack2(row) {
  function split(s) {
    return s.replace(/\|/g,'\n').split('\n').map(it=>it.trim()).filter(it=>(it.length>0))
  }
  const o = {
    id: row.id,
    au: [], va: [], pics:[]
  }
  const v = row.md.replace(/\n-{3,}.*\n/g,'\n---{!!}')
      .replace(/^-{3,}.*\n/,'{!!}')
      .split('\n---').filter(it => (it.trim().length > 0));
  console.log('repack2 v:',v);
  const md = [];
  let last_push = undefined;

  v.forEach((it,j)=>{
  /*
      it is a meta if:
      - (j == 0)&&( '---')  - here (m_Count == 1)
      - (j == 0)&&( '{!!}' ) (m_Count == 1)
      - (j != 0)&&(m_Count%2 == 1)
    */

    if (j == 0) {
      if (!it.startsWith('{!!}')) {
        console.log('line%d md.push',j);
        md.push(format(it)+'\n\n');
        last_push = 'md'; return;
      }
    }
    if (it.startsWith('{!!}')) {
      console.log('line%d md.push',j);
      if (last_push === 'meta') {
        md.push(format(it.substr(4)));
        last_push = 'md'; return;
      }
    }

    console.log('line%d meta',j);
    last_push = 'meta';
    const meta = yaml.safeLoad(it.substr(4));
    Object.keys(meta).forEach(key =>{
      console.log('-- %s:%s',key,meta[key])
      switch(key) {
        case 'h1': o.h1 = meta.h1; break;
        case 'va': o.va = o.va.concat(split(meta.va)); break;
        case 'vr': o.vr = meta.vr; break;
        case 'au': o.au = o.au.concat(split(meta.au));break;
        case 'pics': o.pics = o.pics.concat(meta.pics); break;
        default: // add some meta in html code OR change automate state.
          console.log('ALERT invalid opCode:',key);
      }
    })
  })

  console.log('full-MD:',md);
  o.html = marked(md.join('\n'), { renderer: renderer }); //renderer.render(o.md);
  return o;
}

// ----------------------------------------------------------------------------

// NOW m

function repack3(s) {
  function split(s) {
    return s.replace(/\|/g,'\n').split('\n').map(it=>it.trim()).filter(it=>(it.length>0))
  }

  const v = s.replace(/\n-{3,}.*\n/g,'\n---{!!}')
      .replace(/^-{3,}.*\n/,'{!!}')
      .split('\n---').filter(it => (it.trim().length > 0));

  console.log('repack3 v:',v);

  const o = {va:[], au:[]};
  const md = [];
  let last_push = undefined;

  v.forEach((it,j)=>{
  /*
      it is a meta if:
      - (j == 0)&&( '---')  - here (m_Count == 1)
      - (j == 0)&&( '{!!}' ) (m_Count == 1)
      - (j != 0)&&(m_Count%2 == 1)
    */

    if (j == 0) {
      if (!it.startsWith('{!!}')) {
//        console.log('line%d md.push',j);
        md.push(format(it)+'\n\n');
        last_push = 'md'; return;
      }
    }
    if (it.startsWith('{!!}')) {
//      console.log('line%d md.push',j);
      if (last_push === 'meta') {
        md.push(format(it.substr(4)));
        last_push = 'md'; return;
      }
    }

//    console.log('line%d meta',j);
    last_push = 'meta';
    const meta = yaml.safeLoad(it.substr(4));
    Object.keys(meta).forEach(key =>{
      console.log('-- %s:%s',key,meta[key])
      switch(key) {
        case 'h1': o.h1 = meta.h1; break;
        case 'va': o.va = o.va.concat(split(meta.va)); break;
        case 'vr': o.vr = meta.vr; break;
        case 'au': o.au = o.au.concat(split(meta.au));break;
        case 'pics': o.pics = o.pics.concat(meta.pics); break;
        default: // add some meta in html code OR change automate state.
          console.log('ALERT invalid opCode:',key);
      }
    })
  })

  console.log('full-MD:',md);
  o.html = marked(md.join('\n'), { renderer: renderer }); //renderer.render(o.md);
  return o;
}


export function get_itemx(item_id){
  return new Promise((resolve,reject)=>{
    Meteor.call('get-itemx',{item_id:item_id, opCode:'latest'},(err,data)=>{
      if (err) {
        reject (err);
      }

      console.log('get-itemx =>data:',data);
//      data.row.content.reserved = (data.row.content.flag == 'R');
//      db_row.set(data.row);
//      state.set('html',null);
//      state.set('meta',data.row.content); // Museum is 100% pure YAML.
      const row = {
        id: data.row.item_id,
        md: data.row.description,
        h1: data.row.content.h1,
      }
      const c = data.row.content;
      if (c.vr) row.vr = c.vr;
      if (c.va && c.va.length>0) {row.va = c.va;}
      if (c.au && c.au.length>0) {row.au = c.au;}

      const o = repack3(row.md);
      row.html = o.html; // ignore everything else.
      resolve (row); // ready for UI
    }) // call
 }); // promise
} // get_itemx




// ----------------------------------------------------------------


export function show_article(item_id) {
  return get_itemx(item_id)
  .then(()=>{
    if (subIndex.get())
      get_subIndex_cursor(); // to update cursor.
  })
}
