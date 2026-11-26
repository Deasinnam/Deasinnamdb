/* 작은 마크다운 → HTML (AI 답 표시용). 받은 글은 전부 이스케이프한 뒤 허용한 꼴만 태그로 바꿈 */
(function(){
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
  function inline(s){
    // 이미 이스케이프된 글에 적용
    var codes=[];
    s=s.replace(/`([^`\n]+)`/g,function(_,c){codes.push(c);return "\u0000"+(codes.length-1)+"\u0000"});
    s=s.replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>").replace(/__([^_\n]+)__/g,"<strong>$1</strong>");
    s=s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g,"$1<em>$2</em>");
    s=s.replace(/~~([^~\n]+)~~/g,"<del>$1</del>");
    s=s.replace(/\[([^\]\n]+)\]\((https:\/\/[^)\s]+)\)/g,'<a href="#" data-url="$2">$1</a>');
    s=s.replace(/\u0000(\d+)\u0000/g,function(_,i){return "<code>"+codes[+i]+"</code>"});
    return s;
  }
  function table(lines){
    function cells(l){l=l.trim();if(l[0]==="|")l=l.slice(1);if(l[l.length-1]==="|")l=l.slice(0,-1);return l.split("|").map(function(c){return inline(c.trim())})}
    var h=cells(lines[0]),out="<table><thead><tr>"+h.map(function(c){return "<th>"+c+"</th>"}).join("")+"</tr></thead><tbody>";
    for(var i=2;i<lines.length;i++)out+="<tr>"+cells(lines[i]).map(function(c){return "<td>"+c+"</td>"}).join("")+"</tr>";
    return out+"</tbody></table>";
  }
  function block(text){
    var lines=text.split("\n"),out=[],i=0;
    while(i<lines.length){
      var l=lines[i];
      if(!l.trim()){i++;continue}
      var h=/^(#{1,4})\s+(.*)$/.exec(l);
      if(h){out.push("<h"+h[1].length+">"+inline(h[2])+"</h"+h[1].length+">");i++;continue}
      if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)){out.push("<hr>");i++;continue}
      if(/^\s*\|.*\|\s*$/.test(l)&&i+1<lines.length&&/^\s*\|?\s*:?-{2,}/.test(lines[i+1])){
        var t=[];while(i<lines.length&&/^\s*\|.*\|?\s*$/.test(lines[i])&&lines[i].trim()){t.push(lines[i]);i++}
        out.push(table(t));continue;
      }
      if(/^&gt;\s?/.test(l)){var q=[];while(i<lines.length&&/^&gt;\s?/.test(lines[i])){q.push(lines[i].replace(/^&gt;\s?/,""));i++}out.push("<blockquote>"+block(q.join("\n"))+"</blockquote>");continue}
      var ul=/^(\s*)[-*•]\s+(.*)$/,ol=/^(\s*)\d+[.)]\s+(.*)$/;
      if(ul.test(l)||ol.test(l)){
        var isOl=ol.test(l)&&!ul.test(l),re=isOl?ol:ul,items=[];
        while(i<lines.length&&(re.test(lines[i])||(/^\s{2,}\S/.test(lines[i])&&items.length))){
          var mm=re.exec(lines[i]);
          if(mm)items.push(inline(mm[2]));else items[items.length-1]+="<br>"+inline(lines[i].trim());
          i++;
        }
        out.push((isOl?"<ol>":"<ul>")+items.map(function(x){return "<li>"+x+"</li>"}).join("")+(isOl?"</ol>":"</ul>"));
        continue;
      }
      var p=[];
      while(i<lines.length&&lines[i].trim()&&!/^(#{1,4})\s/.test(lines[i])&&!/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])&&!/^&gt;/.test(lines[i])&&!(/^\s*\|.*\|\s*$/.test(lines[i])&&i+1<lines.length&&/^\s*\|?\s*:?-{2,}/.test(lines[i+1]))){p.push(inline(lines[i]));i++}
      if(p.length)out.push("<p>"+p.join("<br>")+"</p>");else i++;
    }
    return out.join("");
  }
  window.mdRender=function(src,streaming){
    src=String(src||"").replace(/\r/g,"");
    var parts=src.split(/^```/m),html="";
    for(var k=0;k<parts.length;k++){
      if(k%2===0){html+=block(esc(parts[k]));continue}
      var nl=parts[k].indexOf("\n"),lang=nl<0?parts[k].trim():parts[k].slice(0,nl).trim(),code=nl<0?"":parts[k].slice(nl+1);
      code=code.replace(/\n$/,"");
      html+='<pre><div class="ph"><span>'+esc(lang||"코드")+'</span><button data-copy>복사</button></div><code>'+esc(code)+"</code></pre>";
    }
    return html;
  };
})();
