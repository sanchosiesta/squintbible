import * as squint_core from 'squint-cljs/core.js';
import * as dexie from 'https://unpkg.com/dexie@3.2.4/dist/dexie.js';
import * as rg from 'https://unpkg.com/reagami@0.1.37/reagami.mjs';
let link1 = document.createElement("link");
link1.rel = "stylesheet";
link1.href = "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css";
document.head.appendChild(link1);
var books_list = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
var chapter_counts = ({"Jude": 1, "1 Thessalonians": 5, "2 Thessalonians": 3, "Psalm": 150, "Revelation": 22, "Philippians": 4, "Judges": 21, "Galatians": 6, "2 Timothy": 4, "Ecclesiastes": 12, "Lamentations": 5, "2 Kings": 25, "Leviticus": 27, "Philemon": 1, "Joshua": 24, "Jeremiah": 52, "Romans": 16, "1 Peter": 5, "Zephaniah": 3, "Ruth": 4, "1 Kings": 22, "3 John": 1, "James": 5, "Nehemiah": 13, "1 Timothy": 6, "Colossians": 4, "2 Peter": 3, "2 Samuel": 24, "Zechariah": 14, "2 John": 1, "Daniel": 12, "Obadiah": 1, "Matthew": 28, "Luke": 24, "Hosea": 14, "Mark": 16, "John": 21, "Titus": 3, "Exodus": 40, "Nahum": 3, "Esther": 10, "Proverbs": 31, "Isaiah": 66, "Deuteronomy": 34, "Ezekiel": 48, "1 Samuel": 31, "Amos": 9, "Acts": 28, "Malachi": 4, "Joel": 3, "Hebrews": 13, "Numbers": 36, "1 Chronicles": 29, "1 John": 5, "Ezra": 10, "Ephesians": 6, "Job": 42, "Haggai": 2, "1 Corinthians": 16, "Song of Solomon": 8, "Genesis": 50, "Habakkuk": 3, "2 Chronicles": 36, "2 Corinthians": 13, "Micah": 7, "Jonah": 4});
squint_core.println("Dexie global:", typeof Dexie);
var bible_db = (new Dexie("BibleDB"));
bible_db.version(1).stores(squint_core.clj__GT_js(({"verses": "&ref", "highlights": "&verseRef", "settings": "&keyName"})));
var app_state = squint_core.atom(({"verse": 0, "font-size": 18, "search-term": "", "verses": [], "highlights": (new Set ([])), "book": "Genesis", "total-books": 66, "load-progress": 0, "chapter": 1, "count-loaded": 0, "loading": false, "search-results": [], "search-idx": -1}));
var book__GT_filename = function (book) {
return `${"data/"}${book.replace(" ", "_")??''}${".json"}`;

};
var clean_text = function (s) {
if (squint_core.truth_(squint_core.string_QMARK_(s))) {
return s.replace((new RegExp("\\*[a-z]+", "g")), "")} else {
return s};

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
return resp.json();

})).then((function (data) {
const arr2 = js__GT_clj(data, "keywordize-keys", true);
const grouped3 = squint_core.group_by("c", arr2);
const entries4 = squint_core.map((function (p__2) {
const vec__58 = p__2;
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
var load_highlights_BANG_ = function () {
return bible_db.highlights.toArray().then((function (rows) {
const hs1 = squint_core.set(squint_core.map((function (_PERCENT_1) {
return _PERCENT_1.verseRef;

}), js__GT_clj(rows)));
squint_core.swap_BANG_(app_state, squint_core.assoc, "highlights", hs1);
return squint_core.println("Loaded", squint_core.count(hs1), "highlights");

}));

};
var load_settings_BANG_ = function () {
return bible_db.settings.toArray().then((function (rows) {
for (let G__1 of squint_core.iterable(js__GT_clj(rows))) {
const row2 = G__1;
const k3 = squint_core.keyword(row2.keyName);
const v4 = row2.value;
if ((k3 === "font-size")) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "font-size", parseInt(v4, 10))}
};
return squint_core.println("Settings loaded");

}));

};
var save_setting_BANG_ = function (k, v) {
return bible_db.settings.put(squint_core.clj__GT_js(({"keyName": squint_core.name(k), "value": `${v??''}`})));

};
var load_chapter_BANG_ = function (book, ch) {
const ref1 = `${book??''}${":"}${ch??''}`;
return bible_db.verses.get(ref1).then((function (row) {
if (squint_core.truth_(row)) {
const verses2 = js__GT_clj(row.verses, "keywordize-keys", true);
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", book, "chapter", ch, "verse", 0, "verses", verses2);
return squint_core.println("Displaying", book, ch, "-", squint_core.count(verses2), "entries");
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
const verse_num4 = squint_core.get_in(squint_core.deref(app_state), ["verses", squint_core.get(squint_core.deref(app_state), "verse"), "v"]);
const el5 = document.getElementById(`v${verse_num4??''}`);
if (squint_core.truth_(el5)) {
return el5.scrollIntoView(({"behavior": "smooth", "block": "center"}));
};
};

};
var next_verse_BANG_ = function () {
const idx1 = squint_core.get(squint_core.deref(app_state), "verse");
const cnt2 = squint_core.count(squint_core.get(squint_core.deref(app_state), "verses"));
if (((idx1 + 1) < cnt2)) {
return goto_verse_BANG_((idx1 + 1));
};

};
var prev_verse_BANG_ = function () {
const idx1 = squint_core.get(squint_core.deref(app_state), "verse");
if ((idx1 > 0)) {
return goto_verse_BANG_((idx1 - 1));
};

};
var goto_chapter_BANG_ = function (ch) {
const book1 = squint_core.get(squint_core.deref(app_state), "book");
const max_ch2 = get_chapter_count(book1);
if (squint_core.truth_(((ch >= 1) && (ch <= max_ch2)))) {
squint_core.swap_BANG_(app_state, squint_core.assoc, "chapter", ch, "verse", 0, "verses", [], "search-term", "", "search-results", [], "search-idx", -1);
return load_chapter_BANG_(book1, ch);
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
var goto_top_BANG_ = function () {
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
if (squint_core.truth_(squint_core.seq(verses1))) {
return goto_verse_BANG_(0);
};

};
var goto_bottom_BANG_ = function () {
const verses1 = squint_core.get(squint_core.deref(app_state), "verses");
if (squint_core.truth_(squint_core.seq(verses1))) {
return goto_verse_BANG_((squint_core.count(verses1) - 1));
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

}), js__GT_clj(rows)));
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
var render_verse_row = function (v, idx, font_size, highlights, book, chapter) {
const verse_num1 = squint_core.get(v, "v");
const text2 = squint_core.get(v, "t");
const is_heading3 = (squint_core.get(v, "h") > 0);
const ref4 = `${book??''}${":"}${chapter??''}${":"}${verse_num1??''}`;
const highlighted5 = squint_core.contains_QMARK_(highlights, ref4);
if (is_heading3) {
return ["div", ({"style": "padding: 8px 16px; margin-top: 4px;", "class": "has-text-weight-bold has-text-centered is-size-5"}), text2]} else {
return ["div", ({"id": `v${verse_num1??''}`, "onclick": (function (_) {
return toggle_highlight_BANG_(verse_num1);

}), "style": `${"display: flex; padding: 4px 8px; cursor: pointer; border-bottom: 1px solid #eee;"}${((squint_core.truth_(highlighted5)) ? ("background-color: #fff3a8;") : (null))??''}`}), ["div", ({"style": `${"color: #aaa; text-align: right; min-width: 48px; padding-right: 12px; font-size: "}${(font_size - 2)}${"px; user-select: none;"}`}), verse_num1], ["div", ({"style": `${"font-size: "}${font_size??''}${"px; flex: 1;"}`}), text2]]};

};
var render_verses = function () {
const map__12 = squint_core.deref(app_state);
const verses3 = squint_core.get(map__12, "verses");
const font_size4 = squint_core.get(map__12, "font-size");
const highlights5 = squint_core.get(map__12, "highlights");
const book6 = squint_core.get(map__12, "book");
const chapter7 = squint_core.get(map__12, "chapter");
if (squint_core.truth_(squint_core.empty_QMARK_(verses3))) {
return ["div", ({"class": "notification is-info"}), "Loading..."]} else {
return squint_core.into(["div"], squint_core.map_indexed((function (idx, v) {
return render_verse_row(v, idx, font_size4, highlights5, book6, chapter7);

}), verses3))};

};
var render_navbar = function () {
const map__12 = squint_core.deref(app_state);
const book3 = squint_core.get(map__12, "book");
const chapter4 = squint_core.get(map__12, "chapter");
const font_size5 = squint_core.get(map__12, "font-size");
const book_chapters6 = squint_core.range(1, (get_chapter_count(book3) + 1));
const chapters_str7 = `${book3??''}${" "}${chapter4??''}`;
return ["nav", ({"class": "navbar is-dark is-fixed-top", "style": "height: 48px; min-height: 48px;"}), ["div", ({"class": "navbar-brand", "style": "min-height: 48px;"}), ["span", ({"class": "navbar-item", "style": "font-weight: bold; padding: 0 12px; height: 48px;"}), "NASB Bible Reader"]], ["div", ({"class": "navbar-menu is-active", "style": "height: 48px;"}), ["div", ({"class": "navbar-start", "style": "height: 48px; align-items: center;"}), ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["div", ({"class": "select is-small"}), ["select", ({"value": book3, "onchange": (function (e) {
const new_book8 = e.target.value;
squint_core.swap_BANG_(app_state, squint_core.assoc, "book", new_book8, "chapter", 1, "verse", 0, "verses", [], "search-term", "", "search-results", [], "search-idx", -1);
return load_chapter_BANG_(new_book8, 1);

})}), squint_core.lazy((function* () {
for (let G__9 of squint_core.iterable(books_list)) {
const b10 = G__9;
yield ["option", ({"value": b10, "key": b10}), b10];
}
return null;

}))]]], ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["div", ({"class": "select is-small"}), ["select", ({"value": `${chapter4??''}`, "onchange": (function (e) {
const new_ch11 = parseInt(e.target.value, 10);
return goto_chapter_BANG_(new_ch11);

})}), squint_core.lazy((function* () {
for (let G__12 of squint_core.iterable(book_chapters6)) {
const c13 = G__12;
yield ["option", ({"value": `${c13??''}`, "key": c13}), c13];
}
return null;

}))]]], ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["button", ({"class": "button is-small is-light", "onclick": (function (_) {
return change_font_size_BANG_(-2);

}), "title": "Decrease font"}), "A-"]], ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["button", ({"class": "button is-small is-light", "onclick": (function (_) {
return change_font_size_BANG_(2);

}), "title": "Increase font"}), "A+"]], ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["button", ({"class": "button is-small is-info", "onclick": (function (_) {
const input14 = document.getElementById("search-input");
if (squint_core.truth_(input14)) {
input14.focus();
return input14.select();
};

})}), "/ Search"]], ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["button", ({"class": "button is-small is-primary", "onclick": (function (_) {
return load_book_BANG_(book3);

})}), "Load Book"]], ["div", ({"class": "navbar-item", "style": "padding: 4px;"}), ["button", ({"class": "button is-small is-warning", "onclick": (function (_) {
return load_all_BANG_();

})}), "Load All"]]]]];

};
var render_search_bar = function () {
const map__12 = squint_core.deref(app_state);
const search_term3 = squint_core.get(map__12, "search-term");
const search_results4 = squint_core.get(map__12, "search-results");
const search_idx5 = squint_core.get(map__12, "search-idx");
return ["div", ({"style": "padding: 4px 8px; margin-top: 48px; display: flex; gap: 8px; align-items: center;"}), ["input", ({"id": "search-input", "class": "input is-small", "type": "text", "placeholder": "Search current chapter... (n/N to navigate)", "value": search_term3, "style": "max-width: 400px;", "oninput": (function (e) {
return do_search_BANG_(e.target.value);

}), "onkeydown": (function (e) {
if ((e.key === "Enter")) {
search_next_BANG_();
e.preventDefault()};
if ((e.key === "Escape")) {
clear_search_BANG_();
return e.target.blur();
};

})})], ((squint_core.truth_(squint_core.seq(search_results4))) ? (["span", ({"class": "tag is-info"}), `${(search_idx5 + 1)}${"/"}${squint_core.count(search_results4)??''}`]) : (null))];

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
el1.innerHTML = "";
return rg.render(el1, ["div", render_navbar(), render_search_bar(), ["div", ({"style": "margin-top: 8px; padding: 0 8px 60px 8px;"}), render_verses()], render_progress_overlay(), render_status_bar()]);
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
if ((key3 === "h")) {
e.preventDefault();
prev_chapter_BANG_()} else {
if ((key3 === "l")) {
e.preventDefault();
next_chapter_BANG_()} else {
if ((key3 === "/")) {
e.preventDefault();
const input4 = document.getElementById("search-input");
if (squint_core.truth_(input4)) {
input4.focus();
input4.value = "";
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
if ((key3 === "g")) {
e.preventDefault();
const now5 = Date.now();
const temp__23182__auto__6 = window._lastGKey;
if (squint_core.truth_(temp__23182__auto__6)) {
const last_g7 = temp__23182__auto__6;
if (((now5 - last_g7) < 500)) {
goto_top_BANG_()};
window._lastGKey = 0} else {
window._lastGKey = now5}} else {
if (squint_core.truth_((() => {
const and__23718__auto__8 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__8)) {
return (key3 === "d")} else {
return and__23718__auto__8};

})())) {
e.preventDefault();
scroll_half_down_BANG_()} else {
if (squint_core.truth_((() => {
const and__23718__auto__9 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__9)) {
return (key3 === "u")} else {
return and__23718__auto__9};

})())) {
e.preventDefault();
scroll_half_up_BANG_()} else {
if (squint_core.truth_((() => {
const and__23718__auto__10 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__10)) {
return (key3 === "f")} else {
return and__23718__auto__10};

})())) {
e.preventDefault();
scroll_full_down_BANG_()} else {
if (squint_core.truth_((() => {
const and__23718__auto__11 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__11)) {
return (key3 === "b")} else {
return and__23718__auto__11};

})())) {
e.preventDefault();
scroll_full_up_BANG_()} else {
if (squint_core.truth_((() => {
const and__23718__auto__12 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__12)) {
return (key3 === "=")} else {
return and__23718__auto__12};

})())) {
e.preventDefault();
change_font_size_BANG_(2)} else {
if (squint_core.truth_((() => {
const and__23718__auto__13 = e.ctrlKey;
if (squint_core.truth_(and__23718__auto__13)) {
return (key3 === "-")} else {
return and__23718__auto__13};

})())) {
e.preventDefault();
change_font_size_BANG_(-2)} else {
if ((key3 === "Escape")) {
e.preventDefault();
clear_search_BANG_();
const input14 = document.getElementById("search-input");
if (squint_core.truth_(input14)) {
input14.blur()}} else {
if (squint_core.truth_(squint_core.re_matches(/[0-9]/, key3))) {
e.preventDefault();
const now15 = Date.now();
if (squint_core.truth_(window._numberPrefix)) {
const map__1617 = window._numberPrefix;
const digits18 = squint_core.get(map__1617, "digits");
const ts19 = squint_core.get(map__1617, "ts");
if (((now15 - ts19) < 700)) {
window._numberPrefix = ({"digits": `${digits18??''}${key3??''}`, "ts": now15})} else {
window._numberPrefix = ({"digits": key3, "ts": now15})}} else {
window._numberPrefix = ({"digits": key3, "ts": now15})};
setTimeout((function () {
const temp__23263__auto__20 = window._numberPrefix;
if (squint_core.truth_(temp__23263__auto__20)) {
const np21 = temp__23263__auto__20;
if (squint_core._EQ_(np21.ts, now15)) {
const ch22 = parseInt(np21.digits, 10);
if (squint_core.truth_(((ch22 >= 1) && (ch22 <= get_chapter_count(squint_core.get(squint_core.deref(app_state), "book")))))) {
goto_chapter_BANG_(ch22)};
return window._numberPrefix = null;
};
};

}), 700)} else {
}}}}}}}}}}}}}}}}};
return null;
};

};
var init_BANG_ = function () {
squint_core.println("NASB Bible Reader initializing...");
document.onkeydown = handle_keydown;
load_highlights_BANG_();
load_settings_BANG_();
load_chapter_BANG_("Genesis", 1);
render_ui();
squint_core.add_watch(app_state, "rerender", (function (_, _1, _2, _3) {
return render_ui();

}));
return squint_core.println("Initialized!");

};
var bible_app_obj = ({"appState": app_state, "init": init_BANG_, "loadAll": load_all_BANG_, "nextChapter": next_chapter_BANG_, "searchNext": search_next_BANG_, "gotoChapter": goto_chapter_BANG_, "loadBook": load_book_BANG_, "gotoTop": goto_top_BANG_, "searchPrev": search_prev_BANG_, "doSearch": do_search_BANG_, "clearSearch": clear_search_BANG_, "prevChapter": prev_chapter_BANG_, "gotoBottom": goto_bottom_BANG_, "nextVerse": next_verse_BANG_, "rerender": rerender_BANG_, "changeFontSize": change_font_size_BANG_, "prevVerse": prev_verse_BANG_, "toggleHighlight": toggle_highlight_BANG_});
window.bibleApp = bible_app_obj;
init_BANG_();
