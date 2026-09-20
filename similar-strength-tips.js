/* Predict2U v292 — similar-strength / similar-position tips + SMT board.
   Historical game rows have no opponent field. Opponents are recovered only
   from uniquely complementary scorelines in the same league and date.
   Ambiguous days are skipped. Auto Picks gates are not changed. */
(function(factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.P2USimilarStrengthV290=api;
})(function(){
  'use strict';
  const VERSION='peer-v292';
  const MIN_PEER=4;
  const MIN_LEAGUE=6;
  const PPG_BAND=0.35;
  const RANK_FRAC=0.15;
  const SKIP=/friendly/i;
  const FAMILY=Object.freeze({HOME_WIN:'result',AWAY_WIN:'result',DC1X:'double',DCX2:'double',OVER15:'goals',OVER25:'goals',OVER35:'goals',UNDER25:'goals',BTTS_YES:'btts',BTTS_NO:'btts'});
  const ODDS_KEY=Object.freeze({HOME_WIN:'home',AWAY_WIN:'away',DC1X:'dc1x',DCX2:'dcx2',OVER15:'over15',OVER25:'over25',OVER35:'over35',UNDER25:'under25',BTTS_YES:'bttsYes',BTTS_NO:'bttsNo'});
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

  function packGame(g,team,leagueSize){
    const gf=Number(g.gf),ga=Number(g.ga);
    return{
      d:g.d,team:team||'',opp:g.oppName||'',v:g.venue,gf,ga,tot:gf+ga,
      res:gf>ga?'W':gf===ga?'D':'L',
      oppPpg:g.oppPpg!=null?round2(g.oppPpg):null,
      oppRank:g.oppRank!=null?g.oppRank:null,
      leagueSize:leagueSize||g.leagueSize||null
    };
  }

  function marketHit(id,g){
    const tot=Number(g.gf)+Number(g.ga);
    if(id==='HOME_WIN'||id==='AWAY_WIN')return g.gf>g.ga;
    if(id==='DC1X'||id==='DCX2')return g.gf>=g.ga;
    if(id==='OVER15')return tot>=2;
    if(id==='OVER25')return tot>=3;
    if(id==='OVER35')return tot>=4;
    if(id==='UNDER25')return tot<=2;
    if(id==='BTTS_YES')return g.gf>0&&g.ga>0;
    if(id==='BTTS_NO')return g.gf===0||g.ga===0;
    return false;
  }

  function fmtScore(e){return `${e.team} ${e.gf}-${e.ga} ${e.opp}`;}
  function fmtWhen(e){
    const day=String(e.d||'').slice(5).replace('-','/');
    const venue=e.v==='A'?'away':'home';
    const rank=e.oppRank!=null?`${e.oppRank}${e.leagueSize?`/${e.leagueSize}`:''}`:'';
    const ppg=e.oppPpg!=null?`${Number(e.oppPpg).toFixed(2)} PPG`:'';
    const opp=rank||ppg?` (${[rank,ppg].filter(Boolean).join(', ')})`:'';
    return `${day} ${fmtScore(e)} ${venue}${opp}`;
  }
  function marketLine(id,e){
    const tot=e.tot!=null?e.tot:Number(e.gf)+Number(e.ga);
    const goals=`${tot} goal${tot===1?'':'s'}`;
    if(id==='OVER15')return `${goals}${tot>=2?' · cleared 1.5':' · stayed under 1.5'}`;
    if(id==='OVER25')return `${goals}${tot>=3?' · cleared 2.5':' · stayed under 2.5'}`;
    if(id==='OVER35')return `${goals}${tot>=4?' · cleared 3.5':' · stayed under 3.5'}`;
    if(id==='UNDER25')return `${goals}${tot<=2?' · under 2.5':' · over 2.5'}`;
    if(id==='BTTS_YES'||id==='BTTS_NO')return e.gf>0&&e.ga>0?'both sides scored':'one or both blanks';
    if(e.res==='W')return `won ${e.gf}-${e.ga}`;
    if(e.res==='D')return `drew ${e.gf}-${e.ga}`;
    return `lost ${e.gf}-${e.ga}`;
  }

  function evidenceForTip(id,homePeer,awayPeer,homeName,awayName,leagueSize){
    const bags=id==='HOME_WIN'||id==='DC1X'?[[homePeer,homeName]]:id==='AWAY_WIN'||id==='DCX2'?[[awayPeer,awayName]]:[[homePeer,homeName],[awayPeer,awayName]];
    const rows=[];
    const seen=new Set();
    for(const [games,team] of bags){
      for(const g of games||[]){
        const row=packGame(g,team,leagueSize);
        row.hit=marketHit(id,g);
        row.meaning=marketLine(id,row);
        row.line=`${fmtWhen(row)} · ${row.meaning}`;
        const names=[row.team,row.opp].map(s=>String(s||'').toLowerCase()).sort();
        const key=`${row.d}|${names[0]}|${names[1]}`;
        if(seen.has(key))continue;
        seen.add(key);
        rows.push(row);
      }
    }
    rows.sort((a,b)=>(a.hit===b.hit?0:a.hit?-1:1)||String(b.d).localeCompare(String(a.d)));
    return rows.slice(0,8);
  }

  function kickoffLabel(match){
    const raw=String(match&&(match.kickoff||match.matchDate)||'');
    if(/T\d{2}:\d{2}/.test(raw))return `${raw.slice(0,10)} ${raw.slice(11,16)} UTC`;
    return raw.slice(0,10)||'';
  }

  function buildReason(match,intel,tip){
    const home=match.home,away=match.away;
    const points=[];
    const ko=kickoffLabel(match);
    if(intel.homeRank&&intel.awayRank&&intel.leagueSize){
      points.push(`Tonight: ${home} ${intel.homeRank}/${intel.leagueSize} (${intel.homePpg!=null?intel.homePpg.toFixed(2):'—'} PPG) vs ${away} ${intel.awayRank}/${intel.leagueSize} (${intel.awayPpg!=null?intel.awayPpg.toFixed(2):'—'} PPG)${ko?`, kick-off ${ko}`:''}.`);
    }else if(intel.homePpg!=null&&intel.awayPpg!=null){
      points.push(`Tonight: ${home} ${intel.homePpg.toFixed(2)} PPG vs ${away} ${intel.awayPpg.toFixed(2)} PPG${ko?`, kick-off ${ko}`:''}.`);
    }else if(ko){
      points.push(`Tonight: ${home} vs ${away}, kick-off ${ko}.`);
    }
    const gap=Math.abs(intel.ppgGap||0).toFixed(2);
    if(intel.similar)points.push(`Similar-strength matchup — gap ${gap} PPG, inside ±${PPG_BAND} PPG or nearby league rank.`);
    else if(intel.class==='home-stronger')points.push(`${home} are the stronger side by ${gap} PPG. Evidence is games vs sides in ${away}'s band${intel.awayRank?` (${intel.awayRank}/${intel.leagueSize}, ${intel.awayPpg!=null?intel.awayPpg.toFixed(2):'—'} PPG)`:''}.`);
    else if(intel.class==='away-stronger')points.push(`${away} are the stronger side by ${gap} PPG. Evidence is games vs sides in ${home}'s band${intel.homeRank?` (${intel.homeRank}/${intel.leagueSize}, ${intel.homePpg!=null?intel.homePpg.toFixed(2):'—'} PPG)`:''}.`);
    const homeN=intel.home&&intel.home.sample||0;
    const awayN=intel.away&&intel.away.sample||0;
    if(homeN||awayN)points.push(`Peer sample: ${home} ${homeN} uniquely paired game${homeN===1?'':'s'} vs this band, ${away} ${awayN}.`);
    const hits=(tip.evidence||[]).filter(e=>e.hit);
    const misses=(tip.evidence||[]).filter(e=>!e.hit);
    points.push(`${tip.market} landed in ${Math.round((tip.rate||0)*(tip.sample||0))}/${tip.sample} uniquely paired games against that band (${Math.round((tip.rate||0)*100)}%).`);
    if(hits.length)points.push(`Hits: ${hits.slice(0,4).map(e=>e.line||`${fmtWhen(e)} · ${marketLine(tip.id,e)}`).join('; ')}.`);
    if(misses.length)points.push(`Misses: ${misses.slice(0,2).map(e=>e.line||`${fmtWhen(e)} · ${marketLine(tip.id,e)}`).join('; ')}.`);
    const price=oddsForTip(match,tip.id);
    if(price!=null)points.push(`Current price ${price.toFixed(2)}.`);
    else points.push('No price loaded for this market.');
    return{points,text:points.join(' ')};
  }

  function buildTips(homeRates,awayRates,extra){
    const tips=[];
    const add=(id,market,settle,rate,sample,side,note)=>{
      if(sample<MIN_PEER||rate==null)return;
      const tip={id,market,settle,rate:round2(rate),sample,side,note,family:FAMILY[id]||'other'};
      if(extra)tip.evidence=evidenceForTip(id,extra.homePeer,extra.awayPeer,extra.homeName,extra.awayName,extra.leagueSize);
      tips.push(tip);
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
      tips:buildTips(homeRates,awayRates,{homePeer,awayPeer,homeName:h.name,awayName:a.name,leagueSize}),
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

  function oddsForTip(match,id){
    const key=ODDS_KEY[id];
    const n=num(match&&match.odds&&(match.odds[key]||(id==='BTTS_YES'&&match.odds.GG)||(id==='BTTS_NO'&&match.odds.NG)));
    return n;
  }

  function fixtureDate(m){
    return String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);
  }

  function isOpenFixture(m,today){
    const d=fixtureDate(m);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
    if(today&&d<today)return false;
    if(m&&m.homeGoals!=null)return false;
    const status=String(m&&m.status||'').toUpperCase();
    return !['FT','AET','PEN','PST','CANC','ABD','AWD','WO'].includes(status);
  }

  function buildSmtRows(matches,today){
    const day=today||new Date().toISOString().slice(0,10);
    const rows=[];
    for(const m of matches||[]){
      if(!isOpenFixture(m,day))continue;
      const intel=m.peerIntel;
      if(!intel||!Array.isArray(intel.tips)||!intel.tips.length)continue;
      for(const tip of intel.tips){
        const hits=(tip.evidence||[]).filter(e=>e.hit).length;
        const shown=(tip.evidence||[]).length;
        const why=buildReason(m,intel,tip);
        rows.push({
          fixtureId:m.id,date:fixtureDate(m),kickoff:m.kickoff||'',
          league:m.league||'',country:m.country||'',
          home:m.home,away:m.away,
          class:intel.class,similar:!!intel.similar,
          homeRank:intel.homeRank,awayRank:intel.awayRank,leagueSize:intel.leagueSize,
          homePpg:intel.homePpg,awayPpg:intel.awayPpg,ppgGap:intel.ppgGap,
          homeSample:intel.home&&intel.home.sample||0,
          awaySample:intel.away&&intel.away.sample||0,
          id:tip.id,market:tip.market,settle:tip.settle,family:tip.family||FAMILY[tip.id]||'other',
          rate:tip.rate,sample:tip.sample,side:tip.side,note:tip.note,
          odds:oddsForTip(m,tip.id),
          hits,shown,
          evidence:tip.evidence||[],
          reason:why.text,
          points:why.points
        });
      }
    }
    rows.sort((a,b)=>b.rate-a.rate||b.sample-a.sample||String(a.date).localeCompare(String(b.date))||String(a.home).localeCompare(String(b.home)));
    return rows;
  }

  return{
    VERSION,MIN_PEER,MIN_LEAGUE,PPG_BAND,FAMILY,ODDS_KEY,rankTol,teamStrength,isSimilarStrength,
    pairLeagueGames,peerSlice,marketHit,evidenceForTip,buildTips,buildContext,analyseMatchup,
    attachPeerIntel,fromFixture,oddsForTip,buildSmtRows,buildReason,fmtWhen,marketLine,fmtScore
  };
});
