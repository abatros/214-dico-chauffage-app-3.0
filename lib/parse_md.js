const yaml = require('js-yaml');

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
    url = 'http://cc-images.ultimheat.com/' + url;
  }
/*
  return '<div style="text-align:center; width:100%">'
    +'<img  style="display:bloc; max-width:100%;" src="' + url
    +'" alt="' + alt
    +'" title="' + title
    +'" />\n</div>\n';
*/


    return `<img  style="display:block; margin: 0 auto; max-width:100%; max-height:200pt;"
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


function format(s) {
  return s.replace(/{nl}/g,'<br>')
    .replace(/{ref}(.*)\n/g,'&ensp;&mdash;&ensp;<span>$1</span>')
    .replace(/\n>/g,'\n\n>') //!!
}


module.exports = parse_md = function(s) {
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
