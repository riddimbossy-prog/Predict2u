/* Predict2U v201 static self-test. Run with: node news-comment-social-selftest.js */
const fs=require('fs');
const path=require('path');
const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const checks=[];
function check(name,ok){checks.push({name,ok:Boolean(ok)});if(!ok)process.exitCode=1;}
const js=read('news-app-v201.js');
const css=read('news.css')+'\n'+read('news-comments-v201.css');
const sql=read('SUPABASE_NEWS_COMMENT_SOCIAL_v201.sql');
const loader=read('news.js');
const sw=read('sw.js');
check('v201 bundle loaded',/news-app-v201\.js/.test(loader));
check('comment like UI',/data-news-comment-like/.test(js)&&/p2u-news-comment-like/.test(css));
check('owner edit UI',/data-news-comment-edit/.test(js)&&/p2u_news_edit_comment/.test(sql));
check('owner delete UI',/data-news-comment-delete/.test(js)&&/p2u_news_delete_comment/.test(sql));
check('like RPC',/p2u_news_toggle_comment_like/.test(js)&&/p2u_news_toggle_comment_like/.test(sql));
check('targeted like notification',/Your comment received a like/.test(sql)&&/"type","users"|'type','users'/.test(sql));
check('fixed regex',/or clean_body ~ '\(\.\)\\1\{11,\}'/.test(sql)&&!/contact me on\|\(\.\)\\1/.test(sql));
check('soft delete status',/status='deleted'/.test(sql)&&/deleted_at=now\(\)/.test(sql));
check('service worker v201',/predict2u-v201/.test(sw)&&/news-app-v201\.js/.test(sw));
const passed=checks.filter(x=>x.ok).length;
console.log(JSON.stringify({version:'v201',passed,total:checks.length,checks},null,2));
if(process.exitCode)console.error('Predict2U v201 self-test failed.');
