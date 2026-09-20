/* Predict2U v290 — similar-strength / similar-position tips.
   Historical game rows have no opponent field. Opponents are recovered only
   from uniquely complementary scorelines in the same league and date.
   Ambiguous days are skipped. Auto Picks gates are not changed. */
(function(factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.P2USimilarStrengthV290=api;
})(function(){
  'use strict';
  const VERSION='peer-v290';
  const MIN_PEER=4;
  const MIN_LEAGUE=6;
  const PPG_BAND=0.35;
  const RANK_FRAC=0.15;
  const SKIP=/friendly/i;
  const round2=n=>Math.round(Number(n)*100)/100;
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);

  function getHelpers(helpers){
    if(helpers&&typeof helpers.ratesFromGames==='function')return helpers;
    if(typeof require==='function')return require('./enrich-fixtures-from-profiles.js');
    return null;
  }

  function teamStrength(entry,helpers){
    const games=Array.isArray(entry&&entry.games)?entry.games:[];
    const usable=games.filter(g=>Number.isFinite(Number(g.gf))&&Number.isFinite(Number(g.ga)));
    if(usable.length>=4){
      const r=helpers.ratesFromGames(usable);
      return{ppg:r.ppg,gf:r.gf,ga:r.ga,n:r.n,source:'games'};
    }
    const seed=entry&&entry.seed||{};
    if(seed.gfPm!=null&&seed.gaPm!=null){
      const p=helpers.poissonRates(seed.gfPm,seed.gaPm);
      return{ppg:p.ppg,gf:Number(seed.gfPm),ga:Number(seed.gaPm),n:num(seed.n)||usable.length,source:'seed'};
    }
    if(usable.length){
      const r=helpers.ratesFromGames(usable);
      return{ppg:r.ppg,gf:r.gf,ga:r.ga,n:r.n,source:'thin'};
    }
    return null;
  }

  function rankTol(leagueSize){
    return Math.max(2,Math.round((Number(leagueSize)||18)*RANK_FRAC));
  }

  function isSimilarStrength(a,b,leagueSize){
    if(!a||!b)return false;
    if(a.ppg!=null&&b.ppg!=null&&Math.abs(a.ppg-b.ppg)<=PPG_BAND)return true;
    if(a.rank!=null&&b.rank!=null&&Math.abs(a.rank-b.rank)<=rankTol(leagueSize||a.leagueSize||b.leagueSize))return true;
    return false;
  }

  function pairLeagueGames(members){
    const byDate=new Map();
    const add=(date,venue,row)=>{
      if(!byDate.has(date))byDate.set(date,{H:[],A:[]});
      if(venue==='H'||venue==='A')byDate.get(date)[venue].push(row);
    };
    for(const member of members){
      for(const game of member.value&&member.value.games||[]){
        if(!game||!game.d)continue;
        if(!Number.isFinite(Number(game.gf))||!Number.isFinite(Number(game.ga)))continue;
        add(String(game.d).slice(0,10),game.venue,{member,game});
      }
    }
    const out=new Map();
    const push=(key,rec)=>{if(!out.has(key))out.set(key,[]);out.get(key).push(rec);};
    for(const [date,sides] of byDate){
      const homes=sides.H,aways=sides.A;
      const awayUsed=new Set(),homeUsed=new Set();
      for(let i=0;i<homes.length;i+=1){
        const h=homes[i];
        const hits=[];
        for(let j=0;j<aways.length;j+=1){
          const a=aways[j];
          if(h.member.key===a.member.key)continue;
          if(Number(h.game.gf)===Number(a.game.ga)&&Number(h.game.ga)===Number(a.game.gf))hits.push(j);
        }
        if(hits.length!==1)continue;
        const j=hits[0];
        if(awayUsed.has(j)||homeUsed.has(i))continue;
        const away=aways[j];
        let reverse=0;
        for(let k=0;k<homes.length;k+=1){
          if(homeUsed.has(k))continue;
          const cand=homes[k];
          if(Number(cand.game.gf)===Number(away.game.ga)&&Number(cand.game.ga)===Number(away.game.gf))reverse+=1;
        }
        if(reverse!==1)continue;
        homeUsed.add(i);awayUsed.add(j);
        const hs=h.member.strength||{};
        const as=away.member.strength||{};
        push(h.member.key,{d:date,venue:'H',gf:Number(h.game.gf),ga:Number(h.game.ga),oppKey:away.member.key,oppName:away.member.name,oppPpg:as.ppg,oppRank:as.rank});
        push(away.member.key,{d:date,venue:'A',gf:Number(away.game.gf),ga:Number(away.game.ga),oppKey:h.member.key,oppName:h.member.name,oppPpg:hs.ppg,oppRank:hs.rank});
      }
    }
    return out;
  }

  function peerSlice(games,target,preferVenue){
    if(!target||!Array.isArray(games)||!games.length)return[];
    const similar=games.filter(g=>isSimilarStrength(
      {ppg:g.oppPpg,rank:g.oppRank,leagueSize:target.leagueSize},
      target,
      target.leagueSize
    ));
    if(!preferVenue)return similar;
    const venue=similar.filter(g=>g.venue===preferVenue);
    return venue.length>=MIN_PEER?venue:similar;
  }

  function packRates(r,paired){
    if(!r)return{sample:0,paired:paired||0,win:null,draw:null,over15:null,over25:null,over35:null,btts:null,unbeaten:null,gf:null,ga:null};
    return{
      sample:r.n,paired:paired||0,
      win:round2(r.win),draw:round2(r.draw),unbeaten:round2(r.unbeaten),
      over15:round2(r.over15),over25:round2(r.over25),over35:round2(r.over35),
      btts:round2(r.btts),gf:round2(r.gf),ga:round2(r.ga)
    };
  }

  function combined(h,a,key){
    const hn=h&&h.n||0,an=a&&a.n||0;
    if(hn+an<MIN_PEER)return{rate:null,n:hn+an};
    if(!hn)return{rate:a[key],n:an};
    if(!an)return{rate:h[key],n:hn};
    return{rate:(h[key]*hn+a[key]*an)/(hn+an),n:hn+an};
  }

  function buildTips(homeRates,awayRates){
    const tips=[];
    const add=(id,market,settle,rate,sample,side,note)=>{
      if(sample<MIN_PEER||rate==null)return;
      tips.push({id,market,settle,rate:round2(rate),sample,side,note});
    };
    if(homeRates&&homeRates.n>=MIN_PEER){
      if(homeRates.win>=.55)add('HOME_WIN','Home to win','Home Win',homeRates.win,homeRates.n,'home',`Won ${Math.round(homeRates.win*homeRates.n)}/${homeRates.n} against similar-strength sides`);
      if(homeRates.unbeaten>=.70)add('DC1X','Home or Draw','Double Chance 1X',homeRates.unbeaten,homeRates.n,'home',`Unbeaten in ${Math.round(homeRates.unbeaten*homeRates.n)}/${homeRates.n} similar-strength games`);
    }
    if(awayRates&&awayRates.n>=MIN_PEER){
      if(awayRates.win>=.50)add('AWAY_WIN','Away to win','Away Win',awayRates.win,awayRates.n,'away',`Won ${Math.round(awayRates.win*awayRates.n)}/${awayRates.n} against similar-strength sides`);
      if(awayRates.unbeaten>=.70)add('DCX2','Draw or Away','Double Chance X2',awayRates.unbeaten,awayRates.n,'away',`Unbeaten in ${Math.round(awayRates.unbeaten*awayRates.n)}/${awayRates.n} similar-strength games`);
    }
    const o15=combined(homeRates,awayRates,'over15');
    const o25=combined(homeRates,awayRates,'over25');
    const o35=combined(homeRates,awayRates,'over35');
    const btts=combined(homeRates,awayRates,'btts');
    if(o15.rate>=.78)add('OVER15','Over 1.5 Goals','Over 1.5 Goals',o15.rate,o15.n,'both',`Over 1.5 in ${Math.round(o15.rate*o15.n)}/${o15.n} similar-strength games`);
    if(o25.rate>=.62)add('OVER25','Over 2.5 Goals','Over 2.5 Goals',o25.rate,o25.n,'both',`Over 2.5 in ${Math.round(o25.rate*o25.n)}/${o25.n} similar-strength games`);
    if(o35.rate>=.50)add('OVER35','Over 3.5 Goals','Over 3.5 Goals',o35.rate,o35.n,'both',`Over 3.5 in ${Math.round(o35.rate*o35.n)}/${o35.n} similar-strength games`);
    if(o25.rate!=null&&o25.rate<=.38)add('UNDER25','Under 2.5 Goals','Under 2.5 Goals',1-o25.rate,o25.n,'both',`Under 2.5 in ${Math.round((1-o25.rate)*o25.n)}/${o25.n} similar-strength games`);
    if(btts.rate>=.62)add('BTTS_YES','Both Teams to Score — Yes','BTTS Yes',btts.rate,btts.n,'both',`BTTS in ${Math.round(btts.rate*btts.n)}/${btts.n} similar-strength games`);
    if(btts.rate!=null&&btts.rate<=.38)add('BTTS_NO','Both Teams to Score — No','BTTS No',1-btts.rate,btts.n,'both',`BTTS No in ${Math.round((1-btts.rate)*btts.n)}/${btts.n} similar-strength games`);
    tips.sort((x,y)=>y.rate-x.rate||y.sample-x.sample);
    return tips.slice(0,6);
  }

  function buildContext(ledger,helpers){
    const h=getHelpers(helpers);
    if(!h)throw new Error('similar-strength helpers are not loaded');
    const teams=(ledger&&ledger.teams)||{};
    const index=h.buildIndex(teams);
    const byLeague=new Map();
    for(const [key,value] of Object.entries(teams)){
      const league=String(value&&value.league||'Unknown');
      if(!byLeague.has(league))byLeague.set(league,[]);
      byLeague.get(league).push({key,name:(value&&value.name)||String(key).split('|')[0],value,strength:teamStrength(value,h)});
    }
    const ranked=new Map();
    const paired=new Map();
    for(const [league,members] of byLeague){
      const skip=SKIP.test(league);
      const withS=members.filter(m=>m.strength&&m.strength.ppg!=null);
      if(!skip&&withS.length>=MIN_LEAGUE){
        withS.sort((a,b)=>b.strength.ppg-a.strength.ppg||String(a.name).localeCompare(String(b.name)));
        const n=withS.length;
        withS.forEach((m,i)=>{
          m.strength.rank=i+1;
          m.strength.leagueSize=n;
          ranked.set(m.key,{ppg:m.strength.ppg,rank:i+1,leagueSize:n,league,source:m.strength.source,gf:m.strength.gf,ga:m.strength.ga,n:m.strength.n});
        });
        const pairs=pairLeagueGames(members);
        for(const [k,games] of pairs)paired.set(k,games);
      }else{
        for(const m of withS){
          ranked.set(m.key,{ppg:m.strength.ppg,rank:null,leagueSize:withS.length,league,source:m.strength.source,gf:m.strength.gf,ga:m.strength.ga,n:m.strength.n});
        }
      }
    }
    return{index,helpers:h,ranked,paired};
  }

  function lookupMember(ctx,name,league){
    const hit=ctx.helpers.lookup(ctx.index,name,league);
    if(!hit)return null;
    return{key:hit.rec.key,name:hit.rec.name,value:hit.rec.value};
  }

  function emptyIntel(notes,hs,as){
    return{
      version:VERSION,class:'unknown',similar:false,ppgGap:null,rankGap:null,
      leagueSize:hs&&hs.leagueSize||as&&as.leagueSize||null,
      homeRank:hs&&hs.rank||null,awayRank:as&&as.rank||null,
      homePpg:hs&&hs.ppg!=null?round2(hs.ppg):null,
      awayPpg:as&&as.ppg!=null?round2(as.ppg):null,
      home:packRates(null,0),away:packRates(null,0),tips:[],notes:notes||[]
    };
  }

  function analyseMatchup(match,ctx){
    const h=lookupMember(ctx,match&&match.home,match&&match.league);
    const a=lookupMember(ctx,match&&match.away,match&&match.league);
    const hs=h&&ctx.ranked.get(h.key);
    const as_=a&&ctx.ranked.get(a.key);
    const notes=[];
    if(!h||!a)return emptyIntel(['One or both teams are not in the profile ledger.'],hs,as_);
    if(!hs||!as_)return emptyIntel(['Profile strength could not be ranked for this pair.'],hs,as_);
    const sameLeague=hs.league&&as_.league&&hs.league===as_.league;
    const leagueSize=sameLeague?hs.leagueSize:null;
    const ppgGap=hs.ppg!=null&&as_.ppg!=null?round2(hs.ppg-as_.ppg):null;
    const rankGap=sameLeague&&hs.rank&&as_.rank?hs.rank-as_.rank:null;
    const similar=isSimilarStrength(hs,as_,leagueSize);
    const klass=hs.ppg==null||as_.ppg==null?'unknown':similar?'similar':hs.ppg>as_.ppg?'home-stronger':'away-stronger';
    const homePaired=ctx.paired.get(h.key)||[];
    const awayPaired=ctx.paired.get(a.key)||[];
    const homePeer=peerSlice(homePaired,as_,'H');
    const awayPeer=peerSlice(awayPaired,hs,'A');
    const homeRates=homePeer.length?ctx.helpers.ratesFromGames(homePeer):null;
    const awayRates=awayPeer.length?ctx.helpers.ratesFromGames(awayPeer):null;
    if(!homePaired.length&&!awayPaired.length)notes.push('Opponents are counted only from uniquely paired scorelines. This league did not yield unique historical matches.');
    else{
      if(!homeRates||homeRates.n<MIN_PEER)notes.push(`Home has ${homePeer.length} result(s) vs this strength band; ${MIN_PEER}+ needed to publish a home peer tip.`);
      if(!awayRates||awayRates.n<MIN_PEER)notes.push(`Away has ${awayPeer.length} result(s) vs this strength band; ${MIN_PEER}+ needed to publish an away peer tip.`);
    }
    if(hs.source==='seed'||as_.source==='seed')notes.push('One or both ranks use season seed PPG because the empirical sample is thin.');
    return{
      version:VERSION,class:klass,similar,ppgGap,rankGap,
      leagueSize:leagueSize||null,
      homeRank:hs.rank||null,awayRank:as_.rank||null,
      homePpg:round2(hs.ppg),awayPpg:round2(as_.ppg),
      home:packRates(homeRates,homePaired.length),
      away:packRates(awayRates,awayPaired.length),
      tips:buildTips(homeRates,awayRates),
      notes
    };
  }

  function attachPeerIntel(matches,ledger,helpers){
    const ctx=buildContext(ledger,helpers);
    const stats={ranked:ctx.ranked.size,tipped:0,similar:0,attached:0,unknown:0};
    for(const match of matches||[]){
      if(!match||!match.home||!match.away)continue;
      const intel=analyseMatchup(match,ctx);
      match.peerIntel=intel;
      stats.attached+=1;
      if(intel.class==='unknown')stats.unknown+=1;
      if(intel.similar)stats.similar+=1;
      if(intel.tips&&intel.tips.length)stats.tipped+=1;
    }
    return stats;
  }

  function fromFixture(m){
    if(m&&m.peerIntel&&String(m.peerIntel.version||'').indexOf('peer-v')===0)return m.peerIntel;
    const hg=num(m&&m.homeVenueGames),ag=num(m&&m.awayVenueGames);
    const hp=hg&&num(m.homeVenuePts)!=null?m.homeVenuePts/hg:num(m&&m.homeRecent10PPG);
    const ap=ag&&num(m.awayVenuePts)!=null?m.awayVenuePts/ag:num(m&&m.awayRecent10PPG);
    if(hp==null||ap==null)return emptyIntel(['Not enough venue PPG to class this matchup.']);
    const ppgGap=round2(hp-ap);
    const similar=Math.abs(hp-ap)<=PPG_BAND;
    return{
      version:VERSION+'-live',class:similar?'similar':hp>ap?'home-stronger':'away-stronger',
      similar,ppgGap,rankGap:null,leagueSize:null,homeRank:null,awayRank:null,
      homePpg:round2(hp),awayPpg:round2(ap),
      home:packRates(null,0),away:packRates(null,0),tips:[],
      notes:['Class is from current venue PPG. Historical similar-strength results attach on the next data rebuild.']
    };
  }

  return{
    VERSION,MIN_PEER,MIN_LEAGUE,PPG_BAND,rankTol,teamStrength,isSimilarStrength,
    pairLeagueGames,peerSlice,buildTips,buildContext,analyseMatchup,attachPeerIntel,fromFixture
  };
});
