/* ポキト通信 — app.js : 静的ページ内でクエリ文字列による擬似ルーティング */
(function () {
  "use strict";
  var DATA = window.POKI;
  var CAT_NAME = { ero: "エロ", guro: "グロ", sfw: "SFW" };
  var LS_AGE = "poki_age_ok_v1";
  var LS_COM = "poki_comments_";

  function qs() {
    var p = new URLSearchParams(location.search);
    return {
      id: p.get("id"), cat: p.get("cat"), tag: p.get("tag"),
      s: p.get("s"), page: parseInt(p.get("page") || "1", 10),
      taglist: p.get("taglist")
    };
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function find(id) {
    for (var i = 0; i < DATA.articles.length; i++) if (DATA.articles[i].id === id) return DATA.articles[i];
    return null;
  }
  function sorted() {
    return DATA.articles.slice().sort(function (a, b) { return b.id - a.id; });
  }
  function thumbHTML(a, big) {
    return '<a class="thumb' + (big ? " big" : "") + '" style="background:linear-gradient(135deg,' +
      a.color[0] + "," + a.color[1] + ')" href="index.html?id=' + a.id + '">' + a.emoji + "</a>";
  }
  function catBadge(a) {
    return '<a class="cat-badge cat-' + a.cat + '" href="index.html?cat=' + a.cat + '">' +
      (CAT_NAME[a.cat] || a.cat) + "</a>";
  }
  function linkTag(t) { return '<a href="index.html?tag=' + encodeURIComponent(t) + '"><span class="tag">' + esc(t) + "</span></a>"; }
  function tagsInline(a) { return a.tags.map(linkTag).join(" "); }
  function commentCount(a) { return (a.comments || []).length + loadExtra(a.id).length; }

  /* ---- 追加コメント（localStorage） ---- */
  function loadExtra(id) {
    try { return JSON.parse(localStorage.getItem(LS_COM + id) || "[]"); } catch (e) { return []; }
  }
  function saveExtra(id, list) {
    try { localStorage.setItem(LS_COM + id, JSON.stringify(list)); } catch (e) { /* 保存不能時は見逃す */ }
  }

  /* ---- 年齢確認ゲート ---- */
  function ageGate() {
    var gate = document.getElementById("agegate");
    var ok = false;
    try { ok = localStorage.getItem(LS_AGE) === "1"; } catch (e) {}
    if (!ok) {
      gate.hidden = false;
      document.getElementById("age-ok").addEventListener("click", function (e) {
        e.preventDefault();
        try { localStorage.setItem(LS_AGE, "1"); } catch (err) {}
        gate.hidden = true;
      });
    } else {
      gate.hidden = true;
    }
  }

  /* ---- 一覧描画 ---- */
  function renderList(main, q) {
    var all = sorted();
    var items = all, head = "最新記事";
    if (q.cat && CAT_NAME[q.cat]) {
      items = items.filter(function (a) { return a.cat === q.cat; });
      head = CAT_NAME[q.cat] + "カテゴリの新着";
    }
    if (q.tag) {
      items = items.filter(function (a) { return a.tags.indexOf(q.tag) !== -1; });
      head = 'タグ「' + esc(q.tag) + '」の記事';
    }
    if (q.s) {
      items = items.filter(function (a) { return (a.title + a.excerpt + a.tags.join("")) .indexOf(q.s) !== -1; });
      head = '検索「' + esc(q.s) + '」の結果';
    }

    var per = DATA.perPage, total = Math.max(1, Math.ceil(items.length / per));
    var page = Math.min(Math.max(1, q.page || 1), total);
    var shown = items.slice((page - 1) * per, page * per);

    var html = '<div class="list-head">' + head + " <small>（" + items.length + "件 / " + page + "-" + total + "ページ）</small></div>";
    if (!shown.length) {
      html += '<div class="post-card"><p>該当記事がありません。デモデータは' + DATA.articles.length + "本しか入ってませんｗｗ</p></div>";
    }
    shown.forEach(function (a) {
      html += '<article class="post-card">' +
        '<div class="post-date">' + esc(a.date) + "</div>" +
        '<h2 class="post-title"><a href="index.html?id=' + a.id + '">' + esc(a.title) + "</a></h2>" +
        '<div class="post-meta">' + catBadge(a) + "</div>" +
        '<div class="post-body-wrap">' + thumbHTML(a, false) +
        '<div><p class="excerpt">' + esc(a.excerpt) + "</p>" +
        '<a class="read-more" href="index.html?id=' + a.id + '">続きを読む</a></div></div>' +
        '<div class="post-foot">' +
        '<span>💬 <a href="index.html?id=' + a.id + '#comments">Comment(' + commentCount(a) + ")</a></span>" +
        '<span>👁 PV( ' + a.views.toLocaleString() + " )</span>" +
        '<span>' + tagsInline(a) + "</span>" +
        "</div></article>";
    });
    html += pagerHTML(page, total, q);
    main.innerHTML = html;
  }

  function pagerHTML(page, total, q) {
    if (total <= 1) return "";
    function href(p) {
      var base = location.pathname;
      var sp = new URLSearchParams();
      if (q.cat) sp.set("cat", q.cat);
      if (q.tag) sp.set("tag", q.tag);
      if (q.s) sp.set("s", q.s);
      if (p > 1) sp.set("page", String(p));
      var s = sp.toString();
      return base + (s ? "?" + s : "");
    }
    var out = '<div class="pager">';
    for (var p = 1; p <= Math.min(total, 5); p++) {
      out += (p === page) ? '<span class="cur">' + p + "</span>"
        : '<a href="' + href(p) + '">' + p + "</a>";
    }
    if (total > 5) out += "<span>...</span>";
    out += '<a href="' + href(Math.min(page + 1, total)) + '">次のページ&gt;&gt;</a>';
    out += "</div>";
    return out;
  }

  /* ---- 詳細描画 ---- */
  function renderArticle(main, id) {
    var a = find(id);
    if (!a) {
      main.innerHTML = '<div class="post-card"><h2 class="post-title">記事が見つかりません</h2><p><a href="index.html">ホームへ</a></p></div>';
      return;
    }
    var extra = loadExtra(a.id);
    var all = sorted();
    var idx = all.indexOf(a);
    var prev = idx > 0 ? all[idx - 1] : null;          // 1つ新しい
    var next = idx < all.length - 1 ? all[idx + 1] : null; // 1つ古い

    var rel = all.filter(function (b) {
      return b.id !== a.id && b.tags.some(function (t) { return a.tags.indexOf(t) !== -1; });
    }).slice(0, 5);

    var html = '<article class="article">' +
      '<div class="breadcrumb"><a href="index.html">ホーム</a> &gt; <a href="index.html?cat=' + a.cat + '">' + (CAT_NAME[a.cat]) + "</a> &gt; 記事</div>" +
      '<h1>' + esc(a.title) + "</h1>" +
      '<div class="post-date">' + esc(a.date) + " ／ " + catBadge(a) + " ／ 👁 PV( " + a.views.toLocaleString() + " )</div>" +
      '<p class="notice">※デモ記事です。実際の成人向け動画は含まれていません。</p>' +
      thumbHTML(a, true) +
      (a.video
        ? '<div class="video-ph"><span class="play">▶</span>動画はめ込み枠（YouTube埋め込み）<br><iframe width="640" height="360" style="max-width:100%;border:0" src="' + esc(a.video) + '" allowfullscreen loading="lazy"></iframe></div>'
        : '<div class="video-ph"><span class="play">▶</span>ここに関連動画がはまります<br><small>（運用時に動画URL or埋め込みコードを差し替え）</small></div>') +
      a.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      '<div class="post-foot"><span>' + tagsInline(a) + "</span></div>" +
      '<div class="pn">' +
      (prev ? '<a href="index.html?id=' + prev.id + '">&lt;&lt; ' + esc(prev.title.slice(0, 28)) + "…</a>" : "<span></span>") +
      (next ? '<a href="index.html?id=' + next.id + '">' + esc(next.title.slice(0, 28)) + "… &gt;&gt;</a>" : "<span></span>") +
      "</div>";
    if (rel.length) {
      html += '<div class="rel"><h3>関連記事 φ( _ _ )</h3><ul>' + rel.map(function (b) {
        return '<li><a href="index.html?id=' + b.id + '">' + esc(b.title) + "</a></li>";
      }).join("") + "</ul></div>";
    }
    html += "</article>";

    /* コメント欄 */
    var comList = (a.comments || []).concat(extra);
    html += '<section class="comments" id="comments"><h3>💬 コメント (' + comList.length + ")件</h3>";
    comList.forEach(function (c) {
      html += '<div class="comment-item"><span class="c-name">' + esc(c.name) + '</span><span class="c-date">' + esc(c.date) + "</span><p>" + esc(c.text) + "</p></div>";
    });
    html += '<form class="comment-form" id="cform">' +
      '<input type="text" id="cname" placeholder="名前（名無しでOK）" maxlength="20">' +
      '<textarea id="ctext" rows="3" placeholder="コメント待ってます！" required maxlength="400"></textarea>' +
      '<button type="submit" class="btn btn-red">送信する</button></form></section>';

    main.innerHTML = html;

    var form = document.getElementById("cform");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cname").value.trim() || "名無しさん";
      var text = document.getElementById("ctext").value.trim();
      if (!text) return;
      var list = loadExtra(a.id);
      list.push({ name: name, date: nowStamp(), text: text });
      saveExtra(a.id, list);
      location.reload();
    });
  }

  function nowStamp() {
    var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes());
  }

  /* ---- タグ一覧 ---- */
  function renderTagList(main) {
    var counts = tagCounts();
    var html = '<div class="list-head">タグ一覧 (( ;ﾟдﾟ)) <small>（' + Object.keys(counts).length + "個）</small></div>" +
      '<div class="taglist-page">' + Object.keys(counts).sort().map(function (t) {
        return '<a href="index.html?tag=' + encodeURIComponent(t) + '">' + esc(t) + "(" + counts[t] + ")</a>";
      }).join("") + "</div>";
    main.innerHTML = html;
  }

  /* ---- サイドバー ---- */
  function tagCounts() {
    var c = {};
    DATA.articles.forEach(function (a) { a.tags.forEach(function (t) { c[t] = (c[t] || 0) + 1; }); });
    return c;
  }
  function renderSidebar() {
    var all = sorted();
    var latest = all.slice(0, 8);
    var popular = all.slice().sort(function (a, b) { return b.views - a.views; }).slice(0, 10);
    var counts = tagCounts();
    var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 24);

    var html = "";
    html += '<div class="side-box"><div class="side-inner"><form class="search-form" action="index.html" method="get">' +
      '<input type="text" name="s" placeholder="記事検索 φ( _ _ )" value="' + esc(qs().s || "") + '">' +
      '<button type="submit">GO</button></form></div></div>';

    html += '<div class="side-box"><h3>■ 最新記事</h3><div class="side-inner"><ul class="side-list">' +
      latest.map(function (a) {
        return '<li><a href="index.html?id=' + a.id + '">' + esc(a.title) + "</a></li>";
      }).join("") + "</ul></div></div>";

    html += '<div class="side-box"><h3>■ 人気記事ランキング</h3><div class="side-inner"><ul class="side-list rank">' +
      popular.map(function (a, i) {
        return '<li class="rank-item"><span class="num">' + (i + 1) + '</span><a href="index.html?id=' + a.id + '">' + esc(a.title) + "</a></li>";
      }).join("") + "</ul></div></div>";

    html += '<div class="side-box"><h3>■ カテゴリ</h3><div class="side-inner cat-links">' +
      '<a href="index.html?cat=ero"><span class="cat-badge cat-ero">エロ</span>（' + all.filter(function (a) { return a.cat === "ero"; }).length + "本）</a>" +
      '<a href="index.html?cat=guro"><span class="cat-badge cat-guro">グロ</span>（' + all.filter(function (a) { return a.cat === "guro"; }).length + "本）</a>" +
      '<a href="index.html?cat=sfw"><span class="cat-badge cat-sfw">SFW</span>（' + all.filter(function (a) { return a.cat === "sfw"; }).length + "本）</a>" +
      "</div></div>";

    html += '<div class="side-box"><h3>■ タグ一覧 (( ;ﾟдﾟ))</h3><div class="side-inner"><div class="tagcloud">' +
      tags.map(function (t) { return '<a href="index.html?tag=' + encodeURIComponent(t) + '">' + esc(t) + "(" + counts[t] + ")</a>"; }).join("") +
      ' <a href="index.html?taglist=1">もっと見る</a></div></div></div>';

    html += '<div class="side-box"><h3>■ このサイトについて</h3><div class="side-inner"><p style="font-size:12px;margin:0">' +
      "po-kaki-to.com 風の自作HTML/JSプロトタイプです。<br>記事は <code>assets/data.js</code> を編集して追加します。<br>コメントはブラウザに保存されます（デモ）。</p></div></div>";

    document.getElementById("sidebar").innerHTML = html;
  }

  /* ---- ナビのアクティブ ---- */
  function markNav(q) {
    var key = q.id ? "" : (q.taglist ? "search" : q.tag || q.s ? "search" : (q.cat || "all"));
    document.querySelectorAll(".main-nav a").forEach(function (el) {
      if (el.getAttribute("data-nav") === key && key) el.classList.add("active");
    });
  }

  /* ---- 起動 ---- */
  function boot() {
    ageGate();
    var q = qs();
    var main = document.getElementById("main");
    if (q.id) {
      renderArticle(main, parseInt(q.id, 10));
    } else if (q.taglist) {
      renderTagList(main);
    } else {
      renderList(main, q);
    }
    renderSidebar();
    markNav(q);
    document.title = (q.id ? "記事詳細｜" : "") + "ポキト通信｜海外ヤバ動画ニュースまとめ（サンプル）";
  }
  boot();
})();
