/* Predict2U v201 news bootstrap — resilient feed, typo-tolerant search,
   comment likes, owner editing/deletion and targeted like alerts.
   Compatibility markers: p2u_news_articles, p2u_news_post_comment,
   p2u_news_toggle_comment_like, p2u_news_edit_comment, p2u_news_delete_comment,
   p2u:news-alert and window.P2UNews are implemented in news-app-v201.js. */
(function(){
  'use strict';
  if(window.__P2U_NEWS_V201_LOADING__)return;
  window.__P2U_NEWS_V201_LOADING__=true;
  const script=document.createElement('script');
  script.src='news-app-v201.js';
  script.async=false;
  script.dataset.p2uNewsBundle='v201';
  script.onerror=()=>{window.__P2U_NEWS_V201_LOADING__=false;};
  document.head.appendChild(script);
})();
