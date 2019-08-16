const pgp = require('pg-promise')({});
const db = pgp({
  host: 'abatros.com',
  port: 5432,
  database: 'blueink',
  user: 'postgres',
  password: '747!sandeep'
});

//const _select_all = "select id, headline, checksum, posted as last_updated from cc2_articles where title like 'cc3::%' order by headline";

export function get_index() {
  let etime = new Date().getTime();
  return db.any(`
    select item.item_id, item.name,
      r.content->>'h1' as h1,
      r.content->>'vr' as vr,
      r.content->'va' as va,
      r.content->'au' as au
    from cr_items item
    join cr_revisions r on (r.revision_id = item.live_revision)
    where (item.parent_id = $(folder_id))
    order by h1;
    `,{folder_id:605})
  .then(data =>{
    const _etime = new Date().getTime() - etime;
    console.log('dico-chauffage index.length:',data.length)
    return Promise.resolve({
      _etime: _etime,
      rows: data
    })
  })
} // get-index


export function get_itemx(o){
  const etime = new Date().getTime()
  if (o.item_id) {
    if (!(o.opCode && ['live','latest','all'].includes(o.opCode))) {
      o.opCode = 'latest';
    }
    // and always return index for all revisions.
  } else {
    return Promise.reject("dico-chauffage-get-itemx Missing item_id.");
  }

  if (!o.item_id && !o.revision_id) {
    return Promise.reject('Incorrect request get-item: '+o);
  }

  return db.one (`select * from content_item__getx($(item_id),$(opCode))`,o)
  .then(data =>{
    return Promise.resolve({
      _etime: new Date().getTime() - etime,
      row: data
    })
  }) // then
}


export function get_article_Obsolete(id) {
  let etime = new Date().getTime();
  return db.one(`select * from cc2_articles where id = $(id)`,{id: id})
  .then(data =>{
    console.log(data);
    const _etime = new Date().getTime() - etime;
    // const row = require('fs').readFileSync('/home/dkz/dev-utpp/dico-chauffage-app-2.9/.upload/base/Anthracite.md','utf8');
    const row = require('fs').readFileSync('/home/dkz/dev-utpp/dico-chauffage-app-2.9/.upload/base/Fourneau.md','utf8')
    console.log(row);
    return {
      _etime: _etime,
      row:row
    };
  })
} // get-article



export function sitemap_index() {
  let etime = new Date().getTime();
  return db.many(`
    select item.item_id, content->>'h1' as h1
    from cr_items item
    join cr_revisions r on (r.revision_id = item.latest_revision)
    where (parent_id = $(folder_id))
    order by item_id
    `, {folder_id:605})
  .then(data =>{
    console.log('data.length:',data.length);
    return data
      .map(it => {
        const h1 = it.h1.replace(/ {1,}/g,'-');
        return `http://dico-chauffage.ultimheat.com/page/${it.item_id}-${h1}.html`
      })
  })
}
