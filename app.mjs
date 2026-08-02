import * as squint_core from 'squint-cljs/core.js';
import * as clojure_DOT_string from 'squint-cljs/src/squint/string.js';
import * as dexie from 'https://unpkg.com/dexie@3.2.4/dist/dexie.js';
import * as rg from 'https://unpkg.com/reagami@0.1.37/reagami.mjs';
let link1 = document.createElement("link");
link1.rel = "stylesheet";
link1.href = "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css";
document.head.appendChild(link1);
let style2 = document.createElement("style");
style2.textContent = `${"html, body { overflow: auto !important; height: 100%; }"}${".verse-current { background: #e3edf7 !important; border-left: 3px solid #3498db; }"}${".highlighted { background: #fff3a8 !important; }"}${".verse-current.highlighted { background: #c8e6c9 !important; border-left: 3px solid #2e7d32; }"}${"mark { background: #ffb6c1; border-radius: 2px; padding: 0 1px; }"}`;
document.head.appendChild(style2);
var books_list = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
var chapter_counts = ({"Jude": 1, "1 Thessalonians": 5, "2 Thessalonians": 3, "Psalm": 150, "Revelation": 22, "Philippians": 4, "Judges": 21, "Galatians": 6, "2 Timothy": 4, "Ecclesiastes": 12, "Lamentations": 5, "2 Kings": 25, "Leviticus": 27, "Philemon": 1, "Joshua": 24, "Jeremiah": 52, "Romans": 16, "1 Peter": 5, "Zephaniah": 3, "Ruth": 4, "1 Kings": 22, "3 John": 1, "James": 5, "Nehemiah": 13, "1 Timothy": 6, "Colossians": 4, "2 Peter": 3, "2 Samuel": 24, "Zechariah": 14, "2 John": 1, "Daniel": 12, "Obadiah": 1, "Matthew": 28, "Luke": 24, "Hosea": 14, "Mark": 16, "John": 21, "Titus": 3, "Exodus": 40, "Nahum": 3, "Esther": 10, "Proverbs": 31, "Isaiah": 66, "Deuteronomy": 34, "Ezekiel": 48, "1 Samuel": 31, "Amos": 9, "Acts": 28, "Malachi": 4, "Joel": 3, "Hebrews": 13, "Numbers": 36, "1 Chronicles": 29, "1 John": 5, "Ezra": 10, "Ephesians": 6, "Job": 42, "Haggai": 2, "1 Corinthians": 16, "Song of Solomon": 8, "Genesis": 50, "Habakkuk": 3, "2 Chronicles": 36, "2 Corinthians": 13, "Micah": 7, "Jonah": 4});
squint_core.println("Dexie global:", typeof Dexie);
var bible_db = (new Dexie("BibleDB"));
bible_db.version(1).stores(squint_core.clj__GT_js(({"verses": "&ref", "highlights": "&verseRef", "settings": "&keyName"})));
var app_state = squint_core.atom(({"verse": 0, "font-size": 18, "search-term": "", "verses": [], "highlights": (new Set ([])), "book": "Genesis", "total-books": 66, "load-progress": 0, "prev-book": null, "chapter": 1, "count-loaded": 0, "loading": false, "prev-chapter": null, "search-results": [], "search-idx": -1, "prev-verse": null}));
var book__GT_filename = function (book) {
return `${"data/"}${book.replace((new RegExp(" ", "g")), "_")??''}${".json"}`;

};
var clean_text = function (s) {
if (squint_core.truth_(squint_core.string_QMARK_(s))) {
return s.replace((new RegExp("\\*[a-z]+", "g")), "")} else {
return s};

};
var highlight_matches = function (text, term) {
"Wrap occurrences of term in text with <mark> tags, case-insensitive.\n   Returns text unchanged if no match, or a [:span ...] hiccup vector.";
if (squint_core.truth_((() => {
const or__23674__auto__1 = squint_core.empty_QMARK_(term);
if (squint_core.truth_(or__23674__auto__1)) {
return or__23674__auto__1} else {
return squint_core.not(squint_core.string_QMARK_(text))};

})())) {
return text} else {
const lo2 = text.toLowerCase();
const lt3 = term.toLowerCase();
const tl4 = squint_core.count(term);
let start5 = 0;
let parts6 = [];
while(true){
if ((start5 >= squint_core.count(text))) {
if ((squint_core.count(parts6) === 1)) {
return squint_core.first(parts6)} else {
return squint_core.into(["span"], parts6)}} else {
const idx7 = lo2.indexOf(lt3, start5);
if ((idx7 < 0)) {
let G__8 = squint_core.count(text);
let G__9 = squint_core.conj(parts6, text.substring(start5));
start5 = G__8;
parts6 = G__9;
continue;
} else {
const parts10 = (((idx7 > start5)) ? (squint_core.conj(parts6, text.substring(start5, idx7))) : (parts6));
const parts11 = squint_core.conj(parts10, ["mark", text.substring(idx7, (idx7 + tl4))]);
let G__12 = (idx7 + tl4);
let G__13 = parts11;
start5 = G__12;
parts6 = G__13;
continue;
};
};
;break;
}
;
};

};
var read_verse_BANG_ = function () {
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
const idx2 = squint_core.get(squint_core.deref(app_state), "verse");
if (squint_core.truth_((() => {
const and__23718__auto__3 = squint_core.seq(verses1);
if (squint_core.truth_(and__23718__auto__3)) {
return ((idx2 >= 0) && (idx2 < squint_core.count(verses1)))} else {
return and__23718__auto__3};

})())) {
const text4 = squint_core.get(squint_core.nth(verses1, idx2), "t");
speechSynthesis.cancel();
const utterance5 = (new SpeechSynthesisUtterance(text4));
return speechSynthesis.speak(utterance5);
};

};
var yank_verse_BANG_ = function () {
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
const idx2 = squint_core.get(squint_core.deref(app_state), "verse");
const book3 = squint_core.get(squint_core.deref(app_state), "book");
const ch4 = squint_core.get(squint_core.deref(app_state), "chapter");
if (squint_core.truth_((() => {
const and__23718__auto__5 = squint_core.seq(verses1);
if (squint_core.truth_(and__23718__auto__5)) {
return ((idx2 >= 0) && (idx2 < squint_core.count(verses1)))} else {
return and__23718__auto__5};

})())) {
const v6 = squint_core.nth(verses1, idx2);
const vnum7 = squint_core.get(v6, "v");
const text8 = squint_core.get(v6, "t");
const ref9 = `${book3??''}${" "}${ch4??''}${":"}${vnum7??''}`;
return navigator.clipboard.writeText(`${ref9}${" - "}${text8??''}`);
};

};
var book_index = function (book) {
const idx1 = books_list.indexOf(book);
if ((idx1 >= 0)) {
return idx1} else {
return 0};

};
var get_chapter_count = function (book) {
return squint_core.get(chapter_counts, book, 1);

};
var load_book_BANG_ = function (book) {
const filename1 = book__GT_filename(book);
return fetch(filename1).then((function (resp) {
if (squint_core.truth_(resp.ok)) {
return resp.json()} else {
throw (new Error(`${"Failed to load "}${book??''}${": HTTP "}${resp.status??''}`))};

})).then((function (data) {
const arr2 = data;
const grouped3 = squint_core.group_by("c", arr2);
const entries4 = squint_core.map((function (p__3) {
const vec__58 = p__3;
const ch9 = squint_core.nth(vec__58, 0, null);
const verses10 = squint_core.nth(vec__58, 1, null);
return ({"ref": `${book??''}${":"}${ch9??''}`, "book": book, "chapter": (ch9 | 0), "verses": squint_core.map((function (v) {
return ({"v": (squint_core.get(v, "v") | 0), "t": clean_text(squint_core.get(v, "t")), "h": (squint_core.get(v, "h") | 0)});

}), verses10)});

}), grouped3);
return bible_db.verses.bulkPut(squint_core.clj__GT_js(entries4)).then((function () {
squint_core.swap_BANG_(app_state, squint_core.update, "count-loaded", squint_core.inc);
return squint_core.println("Loaded", book, squint_core.count(entries4), "chapters");

}));

})).catch((function (err) {
return console.error("Failed to load", book, err);

}));

};
var save_verse_pos_BANG_ = function () {
const map__12 = squint_core.deref(app_state);
const book3 = squint_core.get(map__12, "book");
const chapter4 = squint_core.get(map__12, "chapter");
const verse5 = squint_core.get(map__12, "verse");
const key6 = `${"pos:"}${book3??''}${":"}${chapter4??''}`;
return bible_db.settings.put(squint_core.clj__GT_js(({"keyName": key6, "value": `${verse5??''}`})));

};
var restore_verse_pos_BANG_ = function (book, ch) {
const key1 = `${"pos:"}${book??''}${":"}${ch??''}`;
return bible_db.settings.get(key1).then((function (row) {
if (squint_core.truth_(row)) {
const verse_idx2 = parseInt(row.value, 10);
const verses3 = squint_core.get(squint_core.deref(app_state), "verses");
if (squint_core.truth_((() => {
const and__23718__auto__4 = squint_core.seq(verses3);
if (squint_core.truth_(and__23718__auto__4)) {
return ((verse_idx2 >= 0) && (verse_idx2 < squint_core.count(verses3)))} else {
return and__23718__auto__4};

})())) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "verse", verse_idx2);
const verse_num5 = squint_core.get(squint_core.nth(verses3, verse_idx2), "v");
const el6 = document.getElementById(`v${verse_num5??''}`);
if (squint_core.truth_(el6)) {
el6.scrollIntoView(({"behavior": "instant", "block": "center"}))};
return squint_core.println("Restored verse position:", book, ch, "verse", verse_idx2);
};
};

}));

};
var load_highlights_BANG_ = function () {
return bible_db.highlights.toArray().then((function (rows) {
const hs1 = squint_core.set(squint_core.map((function (_PERCENT_1) {
return _PERCENT_1.verseRef;

}), rows));
squint_core.swap_BANG_(app_state, squint_core.assoc, "highlights", hs1);
return squint_core.println("Loaded", squint_core.count(hs1), "highlights");

}));

};
var load_settings_BANG_ = function () {
return bible_db.settings.toArray().then((function (rows) {
for (let G__1 of squint_core.iterable(rows)) {
const row2 = G__1;
const k3 = squint_core.keyword(row2.keyName);
const v4 = row2.value;
if ((k3 === "font-size")) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "font-size", parseInt(v4, 10))} else {
if ((k3 === "last-book")) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "saved-book", v4)} else {
if ((k3 === "last-chapter")) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "saved-chapter", parseInt(v4, 10))} else {
}}}
};
if (squint_core.truth_(squint_core.get(squint_core.deref(app_state), "saved-book"))) {
} else {
const temp__23263__auto__5 = (() => {
try{
return window.localStorage.getItem("nasb-last-book");
}
catch(_6){
return null;
}

})();
if (squint_core.truth_(temp__23263__auto__5)) {
const ls_book7 = temp__23263__auto__5;
squint_core.swap_BANG_(app_state, squint_core.assoc, "saved-book", ls_book7)}};
if (squint_core.truth_(squint_core.get(squint_core.deref(app_state), "saved-chapter"))) {
} else {
const temp__23263__auto__8 = (() => {
try{
return window.localStorage.getItem("nasb-last-chapter");
}
catch(_9){
return null;
}

})();
if (squint_core.truth_(temp__23263__auto__8)) {
const ls_ch10 = temp__23263__auto__8;
squint_core.swap_BANG_(app_state, squint_core.assoc, "saved-chapter", parseInt(ls_ch10, 10))}};
return squint_core.println("Settings loaded");

}));

};
var save_setting_BANG_ = function (k, v) {
bible_db.settings.put(squint_core.clj__GT_js(({"keyName": squint_core.name(k), "value": `${v??''}`})));
return (() => {
try{
return window.localStorage.setItem(`nasb-${squint_core.name(k)}`, `${v??''}`);
}
catch(_1){
return null;
}

})();

};
var load_chapter_BANG_ = function (book, ch) {
const ref1 = `${book??''}${":"}${ch??''}`;
return bible_db.verses.get(ref1).then((function (row) {
if (squint_core.truth_(row)) {
const verses2 = row.verses;
const first_verse_idx3 = (() => {
const or__23674__auto__4 = squint_core.first(squint_core.keep_indexed((function (_PERCENT_1, _PERCENT_2) {
if ((_PERCENT_2["h"] === 0)) {
return _PERCENT_1;
};

}), verses2));
if (squint_core.truth_(or__23674__auto__4)) {
return or__23674__auto__4} else {
return 0};

})();
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", book, "chapter", ch, "verse", first_verse_idx3, "verses", verses2);
squint_core.println("Displaying", book, ch, "-", squint_core.count(verses2), "entries (first verse idx:", first_verse_idx3, ")");
return restore_verse_pos_BANG_(book, ch);
} else {
squint_core.println("Chapter not found in DB, loading book first...");
return load_book_BANG_(book).then((function () {
return load_chapter_BANG_(book, ch);

}));
};

}));

};
var goto_verse_BANG_ = function (idx) {
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
const n2 = squint_core.count(verses1);
if ((n2 > 0)) {
const i3 = squint_core.max(0, squint_core.min((n2 - 1), idx));
squint_core.swap_BANG_(app_state, squint_core.assoc, "verse", i3);
return requestAnimationFrame((function () {
const verse_num4 = squint_core.get_in(squint_core.deref(app_state), ["verses", squint_core.get(squint_core.deref(app_state), "verse"), "v"]);
const el5 = document.getElementById(`v${verse_num4??''}`);
if (squint_core.truth_(el5)) {
return el5.scrollIntoView(({"behavior": "instant", "block": "center"}));
};

}));
};

};
var next_verse_BANG_ = function () {
const idx1 = squint_core.get(squint_core.deref(app_state), "verse");
const cnt2 = squint_core.count(squint_core.get(squint_core.deref(app_state), "verses"));
if (((idx1 + 1) < cnt2)) {
goto_verse_BANG_((idx1 + 1));
return save_verse_pos_BANG_();
};

};
var prev_verse_BANG_ = function () {
const idx1 = squint_core.get(squint_core.deref(app_state), "verse");
if ((idx1 > 0)) {
goto_verse_BANG_((idx1 - 1));
return save_verse_pos_BANG_();
};

};
var goto_chapter_BANG_ = function (ch) {
const book1 = squint_core.get(squint_core.deref(app_state), "book");
const max_ch2 = get_chapter_count(book1);
if (squint_core.truth_(((ch >= 1) && (ch <= max_ch2)))) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "chapter", ch, "verse", 0, "verses", [], "search-term", "", "search-results", [], "search-idx", -1);
save_setting_BANG_("last-book", book1);
save_setting_BANG_("last-chapter", `${ch??''}`);
return load_chapter_BANG_(book1, ch);
};

};
var goto_book_BANG_ = function (book) {
"Jump to a specific book at chapter 1. Resets search and verse position.";
if (squint_core.truth_(squint_core.contains_QMARK_(chapter_counts, book))) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", book, "chapter", 1, "verse", 0, "verses", [], "search-term", "", "search-results", [], "search-idx", -1);
save_setting_BANG_("last-book", book);
save_setting_BANG_("last-chapter", "1");
load_chapter_BANG_(book, 1);
return squint_core.println("Switched to", book);
};

};
var next_chapter_BANG_ = function () {
const book1 = squint_core.get(squint_core.deref(app_state), "book");
const ch2 = squint_core.get(squint_core.deref(app_state), "chapter");
const max_ch3 = get_chapter_count(book1);
if ((ch2 < max_ch3)) {
return goto_chapter_BANG_((ch2 + 1))} else {
const bi4 = book_index(book1);
if (((bi4 + 1) < squint_core.count(books_list))) {
const next_book5 = squint_core.nth(books_list, (bi4 + 1));
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", next_book5);
return goto_chapter_BANG_(1);
};
};

};
var prev_chapter_BANG_ = function () {
const book1 = squint_core.get(squint_core.deref(app_state), "book");
const ch2 = squint_core.get(squint_core.deref(app_state), "chapter");
if ((ch2 > 1)) {
return goto_chapter_BANG_((ch2 - 1))} else {
const bi3 = book_index(book1);
if ((bi3 > 0)) {
const prev_book4 = squint_core.nth(books_list, (bi3 - 1));
const max_ch5 = get_chapter_count(prev_book4);
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", prev_book4);
return goto_chapter_BANG_(max_ch5);
};
};

};
var scroll_half_down_BANG_ = function () {
return window.scrollBy(0, ((window.innerHeight / 2) | 0));

};
var scroll_half_up_BANG_ = function () {
return window.scrollBy(0, ((window.innerHeight / -2) | 0));

};
var scroll_full_down_BANG_ = function () {
return window.scrollBy(0, window.innerHeight);

};
var scroll_full_up_BANG_ = function () {
return window.scrollBy(0, (-(window.innerHeight)));

};
var update_current_verse_from_viewport_BANG_ = function () {
const verse_els1 = document.querySelectorAll("[id^=v]");
const viewport_center2 = (window.innerHeight / 2);
const closest3 = squint_core.atom(null);
const closest_dist4 = squint_core.atom(Infinity);
const n45 = verse_els1.length;
let i6 = 0;
for (;i6<n45;i6++) {
(() => {
const el7 = verse_els1.item(i6);
const rect8 = el7.getBoundingClientRect();
const el_center9 = (rect8.top + (rect8.height / 2));
const dist10 = Math.abs((el_center9 - viewport_center2));
if ((dist10 < squint_core.deref(closest_dist4))) {
squint_core.reset_BANG_(closest_dist4, dist10);
return squint_core.reset_BANG_(closest3, el7);
};

})()
};
const temp__23263__auto__11 = squint_core.deref(closest3);
if (squint_core.truth_(temp__23263__auto__11)) {
const closest_el12 = temp__23263__auto__11;
const verse_num13 = parseInt(closest_el12.id.substring(1), 10);
const verses14 = squint_core.get(squint_core.deref(app_state), "verses");
const idx15 = squint_core.first(squint_core.keep_indexed((function (_PERCENT_1, _PERCENT_2) {
if (squint_core._EQ_(squint_core.get(_PERCENT_2, "v"), verse_num13)) {
return _PERCENT_1;
};

}), verses14));
if (squint_core.truth_(idx15)) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "verse", idx15);
return save_verse_pos_BANG_();
};
};

};
var goto_top_BANG_ = function () {
"Jump to first non-heading verse (h=0) and scroll it to center of viewport.";
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
if (squint_core.truth_(squint_core.seq(verses1))) {
const first_non_heading2 = squint_core.first(squint_core.keep_indexed((function (_PERCENT_1, _PERCENT_2) {
if ((_PERCENT_2["h"] === 0)) {
return _PERCENT_1;
};

}), verses1));
return goto_verse_BANG_((() => {
const or__23674__auto__3 = first_non_heading2;
if (squint_core.truth_(or__23674__auto__3)) {
return or__23674__auto__3} else {
return 0};

})());
};

};
var random_chapter_BANG_ = function () {
"Navigate to a random book and chapter.";
const book1 = squint_core.nth(books_list, squint_core.rand_int(squint_core.count(books_list)));
const max_ch2 = get_chapter_count(book1);
const ch3 = (squint_core.rand_int(max_ch2) + 1);
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", book1, "chapter", ch3, "verse", 0, "verses", [], "search-term", "", "search-results", [], "search-idx", -1);
save_setting_BANG_("last-book", book1);
save_setting_BANG_("last-chapter", `${ch3}`);
load_chapter_BANG_(book1, ch3);
return squint_core.println("Random pick:", book1, ch3);

};
var goto_bottom_BANG_ = function () {
"Jump to last non-heading verse (h=0) and scroll it to center of viewport.";
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
if (squint_core.truth_(squint_core.seq(verses1))) {
const last_non_heading2 = squint_core.last(squint_core.keep_indexed((function (_PERCENT_1, _PERCENT_2) {
if ((_PERCENT_2["h"] === 0)) {
return _PERCENT_1;
};

}), verses1));
goto_verse_BANG_((() => {
const or__23674__auto__3 = last_non_heading2;
if (squint_core.truth_(or__23674__auto__3)) {
return or__23674__auto__3} else {
return (squint_core.count(verses1) - 1)};

})());
return save_verse_pos_BANG_();
};

};
var goto_verse_num_BANG_ = function (verse_num) {
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
if (squint_core.truth_(squint_core.seq(verses1))) {
const idx2 = squint_core.first(squint_core.keep_indexed((function (i, v) {
if (squint_core._EQ_(squint_core.get(v, "v"), verse_num)) {
return i;
};

}), verses1));
if (squint_core.truth_(idx2)) {
goto_verse_BANG_(idx2);
save_verse_pos_BANG_();
return squint_core.println("Jumped to verse", verse_num);
} else {
return squint_core.println("Verse", verse_num, "not found in this chapter")};
} else {
return squint_core.println("No verses loaded")};

};
var goto_reference_BANG_ = function (ref_str) {
if (squint_core.truth_((() => {
const or__23674__auto__1 = (ref_str == null);
if (or__23674__auto__1) {
return or__23674__auto__1} else {
return squint_core.empty_QMARK_(clojure_DOT_string.trim(ref_str))};

})())) {
return squint_core.println("Usage: (goto-reference! \"Book Chapter:Verse\") e.g. \"John 3:16\"")} else {
const s2 = clojure_DOT_string.trim(ref_str);
const candidates3 = squint_core.sort_by(squint_core.count, squint_core._GT_, squint_core.filter((function (_PERCENT_1) {
const lo_ref4 = s2.toLowerCase();
const lo_book5 = _PERCENT_1.toLowerCase();
return lo_ref4.startsWith(lo_book5);

}), books_list));
const book6 = squint_core.first(candidates3);
if ((book6 == null)) {
return squint_core.println("Book not recognized in:", squint_core.pr_str(s2))} else {
const remainder7 = clojure_DOT_string.trim(s2.substring(squint_core.count(book6)));
const parts8 = clojure_DOT_string.split(remainder7, /:/);
const ch_str9 = squint_core.first(parts8);
const verse_str10 = squint_core.second(parts8);
const ch11 = ((squint_core.truth_(ch_str9)) ? (parseInt(ch_str9, 10)) : (null));
const verse_num12 = ((squint_core.truth_(verse_str10)) ? (parseInt(verse_str10, 10)) : (null));
const max_ch13 = get_chapter_count(book6);
if (squint_core.truth_((() => {
const or__23674__auto__14 = (ch11 == null);
if (or__23674__auto__14) {
return or__23674__auto__14} else {
return !(ch11 >= 1)};

})())) {
return squint_core.println("Invalid reference:", squint_core.pr_str(s2), "- could not parse chapter")} else {
if ((ch11 > max_ch13)) {
return squint_core.println(book6, "has only", max_ch13, "chapters, not", ch11)} else {
if ("else") {
squint_core.println("Navigating to", book6, ch11, ((squint_core.truth_(verse_num12)) ? (`${":"}${verse_num12??''}`) : ("")));
if (squint_core.truth_((() => {
const or__23674__auto__15 = !squint_core._EQ_(book6, squint_core.get(squint_core.deref(app_state), "book"));
if (or__23674__auto__15) {
return or__23674__auto__15} else {
return !squint_core._EQ_(ch11, squint_core.get(squint_core.deref(app_state), "chapter"))};

})())) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", book6, "chapter", ch11, "verse", 0, "verses", [], "search-term", "", "search-results", [], "search-idx", -1);
return load_chapter_BANG_(book6, ch11).then((function () {
if (squint_core.truth_(verse_num12)) {
return setTimeout((function () {
return goto_verse_num_BANG_(verse_num12);

}), 100);
};

}));
} else {
if (squint_core.truth_(verse_num12)) {
return goto_verse_num_BANG_(verse_num12);
}};
} else {
return null}}};
};
};

};
var search_verse_BANG_ = function () {
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
const idx2 = squint_core.get(squint_core.deref(app_state), "verse");
const book3 = squint_core.get(squint_core.deref(app_state), "book");
const ch4 = squint_core.get(squint_core.deref(app_state), "chapter");
if (squint_core.truth_((() => {
const and__23718__auto__5 = squint_core.seq(verses1);
if (squint_core.truth_(and__23718__auto__5)) {
return ((idx2 >= 0) && (idx2 < squint_core.count(verses1)))} else {
return and__23718__auto__5};

})())) {
const v6 = squint_core.nth(verses1, idx2);
const text7 = squint_core.get(v6, "t");
const vnum8 = squint_core.get(v6, "v");
const ref9 = `${book3??''}${" "}${ch4??''}${":"}${vnum8??''}`;
const query10 = encodeURIComponent(`${"Explain this verse: "}${ref9}${" - "}${text7??''}`);
return window.open(`${"https://www.google.com/search?q="}${query10??''}`, "_blank");
};

};
var toggle_verse_position_BANG_ = function () {
const map__12 = squint_core.deref(app_state);
const book3 = squint_core.get(map__12, "book");
const chapter4 = squint_core.get(map__12, "chapter");
const verse5 = squint_core.get(map__12, "verse");
const prev_book6 = squint_core.get(map__12, "prev-book");
const prev_chapter7 = squint_core.get(map__12, "prev-chapter");
const prev_verse8 = squint_core.get(map__12, "prev-verse");
if ((prev_verse8 == null)) {
return squint_core.swap_BANG_(app_state, squint_core.assoc, "prev-book", book3, "prev-chapter", chapter4, "prev-verse", verse5)} else {
const temp_book9 = book3;
const temp_chapter10 = chapter4;
const temp_verse11 = verse5;
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", prev_book6, "chapter", prev_chapter7, "verse", prev_verse8, "verses", [], "prev-book", temp_book9, "prev-chapter", temp_chapter10, "prev-verse", temp_verse11);
return load_chapter_BANG_(prev_book6, prev_chapter7);
};

};
var toggle_highlight_BANG_ = function (verse_num) {
const book1 = squint_core.get(squint_core.deref(app_state), "book");
const ch2 = squint_core.get(squint_core.deref(app_state), "chapter");
const ref3 = `${book1??''}${":"}${ch2??''}${":"}${verse_num??''}`;
const hs4 = squint_core.get(squint_core.deref(app_state), "highlights");
if (squint_core.truth_(squint_core.contains_QMARK_(hs4, ref3))) {
bible_db.highlights.delete(ref3);
return squint_core.swap_BANG_(app_state, squint_core.update, "highlights", squint_core.disj, ref3);
} else {
bible_db.highlights.put(squint_core.clj__GT_js(({"verseRef": ref3})));
return squint_core.swap_BANG_(app_state, squint_core.update, "highlights", squint_core.conj, ref3);
};

};
var change_font_size_BANG_ = function (delta) {
const new_sz1 = (squint_core.get(squint_core.deref(app_state), "font-size") + delta);
if (squint_core.truth_(((new_sz1 >= 10) && (new_sz1 <= 48)))) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "font-size", new_sz1);
return save_setting_BANG_("font-size", new_sz1);
};

};
var do_search_BANG_ = function (term) {
const term1 = (() => {
const or__23674__auto__2 = term;
if (squint_core.truth_(or__23674__auto__2)) {
return or__23674__auto__2} else {
return ""};

})();
const verses3 = squint_core.get(squint_core.deref(app_state), "verses");
if (squint_core.truth_(squint_core.empty_QMARK_(term1))) {
return squint_core.swap_BANG_(app_state, squint_core.assoc, "search-term", "", "search-results", [], "search-idx", -1)} else {
const results4 = squint_core.keep_indexed((function (i, v) {
if (squint_core.truth_(((squint_core.get(v, "h") === 0) && (squint_core.get(v, "t").toLowerCase().indexOf(term1.toLowerCase()) >= 0)))) {
return i;
};

}), verses3);
squint_core.swap_BANG_(app_state, squint_core.assoc, "search-term", term1, "search-results", squint_core.vec(results4), "search-idx", ((squint_core.truth_(squint_core.seq(results4))) ? (0) : (-1)));
if (squint_core.truth_(squint_core.seq(results4))) {
return goto_verse_BANG_(squint_core.first(results4));
};
};

};
var search_next_BANG_ = function () {
const results1 = squint_core.get(squint_core.deref(app_state), "search-results");
const idx2 = squint_core.get(squint_core.deref(app_state), "search-idx");
if (squint_core.truth_(squint_core.seq(results1))) {
const new_idx3 = squint_core.mod((idx2 + 1), squint_core.count(results1));
squint_core.swap_BANG_(app_state, squint_core.assoc, "search-idx", new_idx3);
return goto_verse_BANG_(squint_core.nth(results1, new_idx3));
};

};
var search_prev_BANG_ = function () {
const results1 = squint_core.get(squint_core.deref(app_state), "search-results");
const idx2 = squint_core.get(squint_core.deref(app_state), "search-idx");
if (squint_core.truth_(squint_core.seq(results1))) {
const new_idx3 = squint_core.mod((idx2 - 1), squint_core.count(results1));
squint_core.swap_BANG_(app_state, squint_core.assoc, "search-idx", new_idx3);
return goto_verse_BANG_(squint_core.nth(results1, new_idx3));
};

};
var clear_search_BANG_ = function () {
return squint_core.swap_BANG_(app_state, squint_core.assoc, "search-term", "", "search-results", [], "search-idx", -1);

};
var load_all_BANG_ = function () {
squint_core.swap_BANG_(app_state, squint_core.assoc, "loading", true, "load-progress", 0, "count-loaded", 0);
return bible_db.verses.toArray().then((function (rows) {
const cached1 = squint_core.set(squint_core.map((function (_PERCENT_1) {
return _PERCENT_1.book;

}), rows));
const to_load2 = squint_core.filter((function (_PERCENT_1) {
return squint_core.not(squint_core.contains_QMARK_(cached1, _PERCENT_1));

}), books_list);
const total3 = squint_core.count(to_load2);
squint_core.swap_BANG_(app_state, squint_core.assoc, "total-books", total3);
if ((total3 === 0)) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "loading", false, "load-progress", 100);
return squint_core.println("All books already cached!");
} else {
const load_next4 = (function load_next (remaining) {
if (squint_core.truth_(squint_core.empty_QMARK_(remaining))) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "loading", false, "load-progress", 100);
return squint_core.println("All books loaded!");
} else {
const book5 = squint_core.first(remaining);
const pct6 = ((100 * ((total3 - squint_core.count(remaining)) / squint_core.max(1, total3))) | 0);
squint_core.swap_BANG_(app_state, squint_core.assoc, "load-progress", pct6);
return load_book_BANG_(book5).then((function () {
squint_core.swap_BANG_(app_state, squint_core.update, "load-progress", (function (_) {
return ((100 * ((total3 - squint_core.count(squint_core.rest(remaining))) / squint_core.max(1, total3))) | 0);

}));
return load_next(squint_core.rest(remaining));

})).catch((function (err) {
console.error("Error loading", book5, err);
return load_next(squint_core.rest(remaining));

}));
};

});
return load_next4(to_load2);
};

}));

};
var render_verse_row = function (v, idx, font_size, highlights, book, chapter, current_verse_num, search_term) {
const verse_num1 = squint_core.get(v, "v");
const text2 = squint_core.get(v, "t");
const is_heading3 = (squint_core.get(v, "h") > 0);
const ref4 = `${book??''}${":"}${chapter??''}${":"}${verse_num1??''}`;
const highlighted5 = squint_core.contains_QMARK_(highlights, ref4);
const is_current6 = squint_core._EQ_(verse_num1, current_verse_num);
if (is_heading3) {
return ["div", ({"style": "padding: 8px 16px; margin-top: 4px;", "class": "has-text-weight-bold has-text-centered is-size-5"}), text2]} else {
return ["div", ({"id": `v${verse_num1??''}`, "onclick": (function (_) {
return toggle_highlight_BANG_(verse_num1);

}), "class": `${((is_current6) ? ("verse-current") : (null))??''}${((squint_core.truth_(highlighted5)) ? (" highlighted") : (null))??''}`, "style": `${"display: flex; padding: 4px 8px; cursor: pointer; border-bottom: 1px solid #eee;"}`}), ["div", ({"style": `${"color: #aaa; text-align: right; min-width: 48px; padding-right: 12px; font-size: "}${(font_size - 2)}${"px; user-select: none;"}`}), verse_num1], ["div", ({"style": `${"font-size: "}${font_size??''}${"px; flex: 1;"}`}), highlight_matches(text2, search_term)]]};

};
var render_verses = function () {
const map__12 = squint_core.deref(app_state);
const verses3 = squint_core.get(map__12, "verses");
const font_size4 = squint_core.get(map__12, "font-size");
const highlights5 = squint_core.get(map__12, "highlights");
const book6 = squint_core.get(map__12, "book");
const chapter7 = squint_core.get(map__12, "chapter");
const verse8 = squint_core.get(map__12, "verse");
const search_term9 = squint_core.get(map__12, "search-term");
const current_verse_num10 = ((squint_core.truth_((() => {
const and__23718__auto__11 = squint_core.seq(verses3);
if (squint_core.truth_(and__23718__auto__11)) {
return ((verse8 >= 0) && (verse8 < squint_core.count(verses3)))} else {
return and__23718__auto__11};

})())) ? (squint_core.get(squint_core.nth(verses3, verse8), "v")) : (null));
if (squint_core.truth_(squint_core.empty_QMARK_(verses3))) {
return ["div", ({"class": "notification is-info"}), "Loading..."]} else {
return squint_core.into(["div"], squint_core.map_indexed((function (idx, v) {
return render_verse_row(v, idx, font_size4, highlights5, book6, chapter7, current_verse_num10, search_term9);

}), verses3))};

};
var render_navbar = function () {
const map__12 = squint_core.deref(app_state);
const book3 = squint_core.get(map__12, "book");
const chapter4 = squint_core.get(map__12, "chapter");
const font_size5 = squint_core.get(map__12, "font-size");
const book_chapters6 = squint_core.range(1, (get_chapter_count(book3) + 1));
const font_minus_btn7 = ["button", ({"class": "button is-small is-light", "onclick": (function (_) {
return change_font_size_BANG_(-2);

}), "title": "Decrease font"}), "A-"];
const font_plus_btn8 = ["button", ({"class": "button is-small is-light", "onclick": (function (_) {
return change_font_size_BANG_(2);

}), "title": "Increase font"}), "A+"];
const speaker_btn9 = ["button", ({"class": "button is-small is-light", "onclick": (function (_) {
return read_verse_BANG_();

}), "title": "Read verse aloud (R)"}), "🔊"];
const search_btn10 = ["button", ({"class": "button is-small is-info", "onclick": (function (_) {
const input11 = document.getElementById("search-input");
if (squint_core.truth_(input11)) {
input11.focus();
return input11.select();
};

})}), "🔍"];
const load_book_btn12 = ["button", ({"class": "button is-small is-primary", "onclick": (function (_) {
return load_book_BANG_(book3);

})}), "Load Book"];
const load_all_btn13 = ["button", ({"class": "button is-small is-warning", "onclick": (function (_) {
return load_all_BANG_();

})}), "Load All"];
const wrap_btn14 = (function (btn) {
return ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), btn];

});
const book_select15 = ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["div", ({"class": "select is-small"}), squint_core.into(["select", ({"value": book3, "onchange": (function (e) {
const new_book16 = e.target.value;
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", new_book16, "chapter", 1, "verse", 0, "verses", [], "search-term", "", "search-results", [], "search-idx", -1);
return load_chapter_BANG_(new_book16, 1);

})})], squint_core.mapv((function (b) {
return ["option", ({"value": b, "key": b}), b];

}), books_list))]];
const chapter_select17 = ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["div", ({"class": "select is-small"}), squint_core.into(["select", ({"value": `${chapter4??''}`, "onchange": (function (e) {
const new_ch18 = parseInt(e.target.value, 10);
return goto_chapter_BANG_(new_ch18);

})})], squint_core.mapv((function (c) {
return ["option", ({"value": `${c??''}`, "key": c}), c];

}), book_chapters6))]];
const nav_brand19 = ["div", ({"class": "navbar-brand", "style": "min-height: 48px;"}), ["span", ({"class": "navbar-item", "style": "font-weight: bold; padding: 0 12px; height: 48px;"}), "NASB"]];
return squint_core.into(["div"], [["nav", ({"class": "navbar is-dark is-fixed-top is-hidden-touch", "style": "height: 48px; min-height: 48px;"}), nav_brand19, ["div", ({"class": "navbar-menu is-active", "style": "height: 48px;"}), squint_core.into(["div", ({"class": "navbar-start", "style": "height: 48px; align-items: center;"})], [book_select15, chapter_select17, wrap_btn14(font_minus_btn7), wrap_btn14(font_plus_btn8), wrap_btn14(speaker_btn9), wrap_btn14(search_btn10), wrap_btn14(load_book_btn12), wrap_btn14(load_all_btn13)])]], ["nav", ({"class": "navbar is-dark is-hidden-desktop", "style": "height: 48px; min-height: 48px; position: fixed; top: 0; left: 0; right: 0; z-index: 31;"}), nav_brand19, ["div", ({"class": "navbar-menu is-active", "style": "height: 48px;"}), squint_core.into(["div", ({"class": "navbar-start", "style": "height: 48px; align-items: center;"})], [book_select15, chapter_select17, wrap_btn14(load_book_btn12), wrap_btn14(load_all_btn13)])]], ["nav", ({"class": "navbar is-dark is-hidden-desktop", "style": "height: 48px; min-height: 48px; position: fixed; top: 48px; left: 0; right: 0; z-index: 30;"}), ["div", ({"class": "navbar-menu is-active", "style": "height: 48px;"}), squint_core.into(["div", ({"class": "navbar-start", "style": "height: 48px; align-items: center;"})], [wrap_btn14(font_minus_btn7), wrap_btn14(font_plus_btn8), wrap_btn14(speaker_btn9), wrap_btn14(search_btn10)])]]]);

};
var render_search_bar = function () {
const map__12 = squint_core.deref(app_state);
const search_term3 = squint_core.get(map__12, "search-term");
const search_results4 = squint_core.get(map__12, "search-results");
const search_idx5 = squint_core.get(map__12, "search-idx");
const input_el6 = ["input", ({"id": "search-input", "class": "input is-small", "type": "text", "placeholder": "Search current chapter... (n/N to navigate)", "value": search_term3, "style": "max-width: 400px;", "oninput": (function (e) {
return do_search_BANG_(e.target.value);

}), "onkeydown": (function (e) {
if ((e.key === "Enter")) {
search_next_BANG_();
e.preventDefault()};
if ((e.key === "Escape")) {
clear_search_BANG_();
return e.target.blur();
};

})})];
const results_tag7 = ((squint_core.truth_(squint_core.seq(search_results4))) ? (["span", ({"class": "tag is-info"}), `${(search_idx5 + 1)}${"/"}${squint_core.count(search_results4)??''}`]) : (null));
return squint_core.into(["div"], [["div", ({"class": "is-hidden-touch", "style": "padding: 4px 8px; margin-top: 48px; display: flex; gap: 8px; align-items: center;"}), input_el6, results_tag7], ["div", ({"class": "is-hidden-desktop", "style": "padding: 4px 8px; margin-top: 96px; display: flex; gap: 8px; align-items: center;"}), input_el6, results_tag7]]);

};
var render_progress_overlay = function () {
const map__12 = squint_core.deref(app_state);
const loading3 = squint_core.get(map__12, "loading");
const load_progress4 = squint_core.get(map__12, "load-progress");
const total_books5 = squint_core.get(map__12, "total-books");
if (squint_core.truth_(loading3)) {
return ["div", ({"style": "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;"}), ["div", ({"style": "background: white; padding: 24px; border-radius: 8px; min-width: 300px; text-align: center;"}), ["p", ({"class": "is-size-5 mb-4"}), "Loading all books..."], ["progress", ({"class": "progress is-primary", "value": load_progress4, "max": "100", "style": "width: 100%;"}), `${load_progress4??''}${"%"}`], ["p", ({"style": "margin-top: 8px;"}), `${load_progress4??''}${"%"}`]]];
};

};
var render_status_bar = function () {
const map__12 = squint_core.deref(app_state);
const book3 = squint_core.get(map__12, "book");
const chapter4 = squint_core.get(map__12, "chapter");
const verse5 = squint_core.get(map__12, "verse");
const verses6 = squint_core.get(map__12, "verses");
const highlights7 = squint_core.get(map__12, "highlights");
const search_results8 = squint_core.get(map__12, "search-results");
const search_term9 = squint_core.get(map__12, "search-term");
const font_size10 = squint_core.get(map__12, "font-size");
const total_verses11 = squint_core.count(squint_core.filter((function (v) {
return (squint_core.get(v, "h") === 0);

}), verses6));
return ["div", ({"style": "position: fixed; bottom: 0; left: 0; right: 0; background: #f5f5f5; border-top: 1px solid #ddd; padding: 4px 12px; font-size: 12px; display: flex; justify-content: space-between; z-index: 50;"}), ["span", `${book3??''}${" "}${chapter4??''}${" | "}${(((squint_core.count(verses6) > 0)) ? (`${"Verse "}${(verse5 + 1)}${"/"}${squint_core.count(verses6)??''}${" | "}`) : (null))??''}${"Font: "}${font_size10??''}px`], ["span", `${squint_core.count(highlights7)??''}${" highlights"}${((squint_core.truth_(squint_core.seq(search_results8))) ? (`${" | Search: "}${(squint_core.get(squint_core.deref(app_state), "search-idx") + 1)}${"/"}${squint_core.count(search_results8)??''}`) : (null))??''}`], ["span", "j/k verse | h/l chapter | gg/G top/bot | / search | n/N next/prev match | Ctrl+d/u scroll | Ctrl+=/- font"]];

};
var render_ui = function () {
const el1 = document.getElementById("app");
if (squint_core.truth_(el1)) {
const verse_container2 = document.querySelector("[style*=\"overflow-y\"]");
const scroll_top3 = ((squint_core.truth_(verse_container2)) ? (verse_container2.scrollTop) : (0));
el1.innerHTML = "";
rg.render(el1, ["div", render_navbar(), render_search_bar(), ["div", ({"style": "margin-top: 8px; padding: 0 8px 60px 8px; overflow-y: auto; height: calc(100vh - 200px);"}), render_verses()], render_progress_overlay(), render_status_bar()]);
const new_container4 = document.querySelector("[style*=\"overflow-y\"]");
if (squint_core.truth_(new_container4)) {
new_container4.scrollTop = scroll_top3};
return setTimeout((function () {
const book_sel5 = document.querySelector("select");
if (squint_core.truth_(book_sel5)) {
book_sel5.value = squint_core.get(squint_core.deref(app_state), "book")};
const sels6 = document.querySelectorAll("select");
if (squint_core.truth_((() => {
const and__23718__auto__7 = sels6;
if (squint_core.truth_(and__23718__auto__7)) {
return (sels6.length >= 2)} else {
return and__23718__auto__7};

})())) {
return sels6[1].value = `${squint_core.get(squint_core.deref(app_state), "chapter")??''}`;
};

}), 50);
};

};
var rerender_BANG_ = function () {
return render_ui();

};
var handle_keydown = function (e) {
const tag1 = e.target.tagName;
const tag_upper2 = ((squint_core.truth_(tag1)) ? (tag1.toUpperCase()) : (null));
if (squint_core.not(squint_core.contains_QMARK_((new Set (["INPUT", "TEXTAREA", "SELECT"])), tag_upper2))) {
const key3 = e.key;
if ((key3 === "j")) {
e.preventDefault();
next_verse_BANG_()} else {
if ((key3 === "k")) {
e.preventDefault();
prev_verse_BANG_()} else {
if ((key3 === "Enter")) {
e.preventDefault();
scroll_half_down_BANG_();
update_current_verse_from_viewport_BANG_()} else {
if ((key3 === "Backspace")) {
e.preventDefault();
scroll_half_up_BANG_();
update_current_verse_from_viewport_BANG_()} else {
if ((key3 === " ")) {
e.preventDefault();
const verses4 = squint_core.get(squint_core.deref(app_state), "verses");
const idx5 = squint_core.get(squint_core.deref(app_state), "verse");
if (squint_core.truth_((() => {
const and__23718__auto__6 = squint_core.seq(verses4);
if (squint_core.truth_(and__23718__auto__6)) {
return ((idx5 >= 0) && (idx5 < squint_core.count(verses4)))} else {
return and__23718__auto__6};

})())) {
const v7 = squint_core.nth(verses4, idx5);
const vnum8 = squint_core.get(v7, "v");
if (squint_core.truth_(vnum8)) {
toggle_highlight_BANG_(vnum8)}}} else {
if ((key3 === "%")) {
e.preventDefault();
toggle_verse_position_BANG_()} else {
if (squint_core.truth_((() => {
const or__23674__auto__9 = (key3 === "R");
if (or__23674__auto__9) {
return or__23674__auto__9} else {
return (key3 === "o")};

})())) {
e.preventDefault();
read_verse_BANG_()} else {
if ((key3 === "h")) {
e.preventDefault();
prev_chapter_BANG_()} else {
if ((key3 === "l")) {
e.preventDefault();
next_chapter_BANG_()} else {
if ((key3 === "/")) {
e.preventDefault();
const input10 = document.getElementById("search-input");
if (squint_core.truth_(input10)) {
input10.focus();
input10.value = "";
clear_search_BANG_()}} else {
if ((key3 === "n")) {
e.preventDefault();
search_next_BANG_()} else {
if ((key3 === "N")) {
e.preventDefault();
search_prev_BANG_()} else {
if ((key3 === "G")) {
e.preventDefault();
goto_bottom_BANG_()} else {
if ((key3 === "z")) {
e.preventDefault();
const now11 = Date.now();
const temp__23182__auto__12 = window._lastZKey;
if (squint_core.truth_(temp__23182__auto__12)) {
const last_z13 = temp__23182__auto__12;
if (((now11 - last_z13) < 500)) {
const v14 = squint_core.get(squint_core.deref(app_state), "verse");
const verses15 = squint_core.get(squint_core.deref(app_state), "verses");
const verse_num16 = ((squint_core.truth_((() => {
const and__23718__auto__17 = squint_core.seq(verses15);
if (squint_core.truth_(and__23718__auto__17)) {
return ((v14 >= 0) && (v14 < squint_core.count(verses15)))} else {
return and__23718__auto__17};

})())) ? (squint_core.get(squint_core.nth(verses15, v14), "v")) : (null));
const el18 = ((squint_core.truth_(verse_num16)) ? (document.getElementById(`v${verse_num16??''}`)) : (null));
if (squint_core.truth_(el18)) {
requestAnimationFrame((function () {
return el18.scrollIntoView(({"behavior": "instant", "block": "center"}));

}))}};
window._lastZKey = null} else {
window._lastZKey = now11;
setTimeout((function () {
if (squint_core._EQ_(window._lastZKey, now11)) {
const v19 = squint_core.get(squint_core.deref(app_state), "verse");
const verses20 = squint_core.get(squint_core.deref(app_state), "verses");
const verse_num21 = ((squint_core.truth_((() => {
const and__23718__auto__22 = squint_core.seq(verses20);
if (squint_core.truth_(and__23718__auto__22)) {
return ((v19 >= 0) && (v19 < squint_core.count(verses20)))} else {
return and__23718__auto__22};

})())) ? (squint_core.get(squint_core.nth(verses20, v19), "v")) : (null));
const el23 = ((squint_core.truth_(verse_num21)) ? (document.getElementById(`v${verse_num21??''}`)) : (null));
if (squint_core.truth_(el23)) {
requestAnimationFrame((function () {
return el23.scrollIntoView(({"behavior": "instant", "block": "start"}));

}))};
return window._lastZKey = null;
};

}), 500)}} else {
if ((key3 === "t")) {
const temp__23182__auto__24 = window._lastZKey;
if (squint_core.truth_(temp__23182__auto__24)) {
const last_z25 = temp__23182__auto__24;
if (((Date.now() - last_z25) < 500)) {
e.preventDefault();
const v26 = squint_core.get(squint_core.deref(app_state), "verse");
const verses27 = squint_core.get(squint_core.deref(app_state), "verses");
const verse_num28 = ((squint_core.truth_((() => {
const and__23718__auto__29 = squint_core.seq(verses27);
if (squint_core.truth_(and__23718__auto__29)) {
return ((v26 >= 0) && (v26 < squint_core.count(verses27)))} else {
return and__23718__auto__29};

})())) ? (squint_core.get(squint_core.nth(verses27, v26), "v")) : (null));
const el30 = ((squint_core.truth_(verse_num28)) ? (document.getElementById(`v${verse_num28??''}`)) : (null));
if (squint_core.truth_(el30)) {
requestAnimationFrame((function () {
return el30.scrollIntoView(({"behavior": "instant", "block": "start"}));

}))};
window._lastZKey = null;
true} else {
window._lastZKey = null;
e.preventDefault();
goto_top_BANG_()}} else {
e.preventDefault();
goto_top_BANG_()}} else {
if ((key3 === "b")) {
const temp__23182__auto__31 = window._lastZKey;
if (squint_core.truth_(temp__23182__auto__31)) {
const last_z32 = temp__23182__auto__31;
if (((Date.now() - last_z32) < 500)) {
e.preventDefault();
const v33 = squint_core.get(squint_core.deref(app_state), "verse");
const verses34 = squint_core.get(squint_core.deref(app_state), "verses");
const verse_num35 = ((squint_core.truth_((() => {
const and__23718__auto__36 = squint_core.seq(verses34);
if (squint_core.truth_(and__23718__auto__36)) {
return ((v33 >= 0) && (v33 < squint_core.count(verses34)))} else {
return and__23718__auto__36};

})())) ? (squint_core.get(squint_core.nth(verses34, v33), "v")) : (null));
const el37 = ((squint_core.truth_(verse_num35)) ? (document.getElementById(`v${verse_num35??''}`)) : (null));
if (squint_core.truth_(el37)) {
requestAnimationFrame((function () {
return el37.scrollIntoView(({"behavior": "instant", "block": "end"}));

}))};
window._lastZKey = null;
true} else {
window._lastZKey = null;
e.preventDefault();
goto_bottom_BANG_()}} else {
e.preventDefault();
goto_bottom_BANG_()}} else {
if ((key3 === "y")) {
e.preventDefault();
const now38 = Date.now();
if (squint_core.truth_((() => {
const and__23718__auto__39 = window._lastYKey;
if (squint_core.truth_(and__23718__auto__39)) {
return ((now38 - window._lastYKey) < 500)} else {
return and__23718__auto__39};

})())) {
yank_verse_BANG_();
window._lastYKey = null} else {
window._lastYKey = now38}} else {
if ((key3 === "g")) {
e.preventDefault();
const now40 = Date.now();
if (squint_core.truth_(window._lastGKey)) {
if (((now40 - window._lastGKey) < 500)) {
goto_top_BANG_();
window._lastGKey = now40} else {
window._lastGKey = now40}} else {
window._lastGKey = now40}} else {
if ((key3 === "u")) {
if (squint_core.truth_(e.ctrlKey)) {
e.preventDefault();
scroll_half_up_BANG_()} else {
const temp__23263__auto__41 = window._lastGKey;
if (squint_core.truth_(temp__23263__auto__41)) {
const last_g42 = temp__23263__auto__41;
e.preventDefault();
if (((Date.now() - last_g42) < 500)) {
search_verse_BANG_()};
window._lastGKey = null}}} else {
if (squint_core.truth_((() => {
const and__23718__auto__43 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__43)) {
return (key3 === "d")} else {
return and__23718__auto__43};

})())) {
e.preventDefault();
scroll_half_down_BANG_()} else {
if (squint_core.truth_((() => {
const and__23718__auto__44 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__44)) {
return (key3 === "f")} else {
return and__23718__auto__44};

})())) {
e.preventDefault();
scroll_full_down_BANG_()} else {
if (squint_core.truth_((() => {
const and__23718__auto__45 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__45)) {
return (key3 === "b")} else {
return and__23718__auto__45};

})())) {
e.preventDefault();
scroll_full_up_BANG_()} else {
if (squint_core.truth_((() => {
const and__23718__auto__46 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__46)) {
return (key3 === "=")} else {
return and__23718__auto__46};

})())) {
e.preventDefault();
change_font_size_BANG_(2)} else {
if (squint_core.truth_((() => {
const and__23718__auto__47 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__47)) {
return (key3 === "-")} else {
return and__23718__auto__47};

})())) {
e.preventDefault();
change_font_size_BANG_(-2)} else {
if ((key3 === "Escape")) {
e.preventDefault();
clear_search_BANG_();
const input48 = document.getElementById("search-input");
if (squint_core.truth_(input48)) {
input48.blur()}} else {
if ((key3 === "v")) {
const temp__23263__auto__49 = window._numberPrefix;
if (squint_core.truth_(temp__23263__auto__49)) {
const np50 = temp__23263__auto__49;
if (((Date.now() - np50.ts) < 700)) {
e.preventDefault();
const vnum51 = parseInt(np50.digits, 10);
if ((vnum51 >= 1)) {
goto_verse_num_BANG_(vnum51)};
window._numberPrefix = null}}} else {
if (squint_core.truth_(squint_core.re_matches(/[0-9]/, key3))) {
e.preventDefault();
const now52 = Date.now();
if (squint_core.truth_(window._numberPrefix)) {
const map__5354 = window._numberPrefix;
const digits55 = squint_core.get(map__5354, "digits");
const ts56 = squint_core.get(map__5354, "ts");
if (((now52 - ts56) < 700)) {
window._numberPrefix = ({"digits": `${digits55??''}${key3??''}`, "ts": now52})} else {
window._numberPrefix = ({"digits": key3, "ts": now52})}} else {
window._numberPrefix = ({"digits": key3, "ts": now52})};
setTimeout((function () {
const temp__23263__auto__57 = window._numberPrefix;
if (squint_core.truth_(temp__23263__auto__57)) {
const np58 = temp__23263__auto__57;
if (squint_core._EQ_(np58.ts, now52)) {
const ch59 = parseInt(np58.digits, 10);
if (squint_core.truth_(((ch59 >= 1) && (ch59 <= get_chapter_count(squint_core.get(squint_core.deref(app_state), "book")))))) {
goto_chapter_BANG_(ch59)};
return window._numberPrefix = null;
};
};

}), 700)} else {
}}}}}}}}}}}}}}}}}}}}}}}}}}};
return null;
};

};
var init_BANG_ = function () {
squint_core.println("NASB Bible Reader initializing...");
document.onkeydown = handle_keydown;
const startX1 = squint_core.atom(0);
const startY2 = squint_core.atom(0);
document.addEventListener("touchstart", (function (e) {
if (squint_core.truth_((() => {
const and__23718__auto__3 = e;
if (squint_core.truth_(and__23718__auto__3)) {
const and__23718__auto__4 = e.touches;
if (squint_core.truth_(and__23718__auto__4)) {
return (e.touches.length > 0)} else {
return and__23718__auto__4};
} else {
return and__23718__auto__3};

})())) {
const touch5 = e.touches[0];
const tag6 = e.target.tagName;
if (squint_core.not(squint_core.contains_QMARK_((new Set (["INPUT", "TEXTAREA", "SELECT"])), tag6))) {
squint_core.reset_BANG_(startX1, touch5.clientX);
return squint_core.reset_BANG_(startY2, touch5.clientY);
};
};

}), ({"passive": true}));
document.addEventListener("touchend", (function (e) {
if (squint_core.truth_((() => {
const and__23718__auto__7 = e;
if (squint_core.truth_(and__23718__auto__7)) {
const and__23718__auto__8 = e.changedTouches;
if (squint_core.truth_(and__23718__auto__8)) {
return (e.changedTouches.length > 0)} else {
return and__23718__auto__8};
} else {
return and__23718__auto__7};

})())) {
const touch9 = e.changedTouches[0];
const deltaX10 = (touch9.clientX - squint_core.deref(startX1));
const deltaY11 = (touch9.clientY - squint_core.deref(startY2));
if (squint_core.truth_(((Math.abs(deltaX10) > 50) && (Math.abs(deltaX10) > Math.abs(deltaY11))))) {
if ((deltaX10 < 0)) {
return next_chapter_BANG_()} else {
return prev_chapter_BANG_()};
};
};

}), ({"passive": true}));
squint_core.add_watch(app_state, "rerender", (function (_, _12, _13, _14) {
return render_ui();

}));
render_ui();
load_highlights_BANG_();
load_settings_BANG_().then((function () {
const map__1516 = squint_core.deref(app_state);
const saved_book17 = squint_core.get(map__1516, "saved-book");
const saved_chapter18 = squint_core.get(map__1516, "saved-chapter");
const book19 = ((squint_core.truth_((() => {
const and__23718__auto__20 = saved_book17;
if (squint_core.truth_(and__23718__auto__20)) {
return squint_core.contains_QMARK_(chapter_counts, saved_book17)} else {
return and__23718__auto__20};

})())) ? (saved_book17) : ("Genesis"));
const chapter21 = ((squint_core.truth_((() => {
const and__23718__auto__22 = saved_chapter18;
if (squint_core.truth_(and__23718__auto__22)) {
return ((saved_chapter18 >= 1) && (saved_chapter18 <= get_chapter_count(book19)))} else {
return and__23718__auto__22};

})())) ? (saved_chapter18) : (1));
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", book19, "chapter", chapter21);
load_chapter_BANG_(book19, chapter21);
return squint_core.println("Restored last position:", book19, "chapter", chapter21);

})).catch((function (err) {
console.error("Failed to restore last position, loading Genesis 1", err);
return load_chapter_BANG_("Genesis", 1);

}));
return squint_core.println("Initialized!");

};
var bible_app_obj = ({"appState": app_state, "init": init_BANG_, "loadAll": load_all_BANG_, "nextChapter": next_chapter_BANG_, "searchNext": search_next_BANG_, "gotoChapter": goto_chapter_BANG_, "loadBook": load_book_BANG_, "randomChapter": random_chapter_BANG_, "gotoTop": goto_top_BANG_, "searchPrev": search_prev_BANG_, "doSearch": do_search_BANG_, "clearSearch": clear_search_BANG_, "prevChapter": prev_chapter_BANG_, "gotoBottom": goto_bottom_BANG_, "nextVerse": next_verse_BANG_, "rerender": rerender_BANG_, "gotoVerseNum": goto_verse_num_BANG_, "changeFontSize": change_font_size_BANG_, "prevVerse": prev_verse_BANG_, "toggleHighlight": toggle_highlight_BANG_});
window.bibleApp = bible_app_obj;
init_BANG_();
