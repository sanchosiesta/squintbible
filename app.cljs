;; ── NASB Bible Reader ──
;; Dependencies: Reagami (UI), Dexie (IndexedDB), Bulma (CSS)

(require '["https://unpkg.com/dexie@3.2.4/dist/dexie.js" :as dexie])
(require '["https://unpkg.com/reagami@0.1.37/reagami.mjs" :as rg])

;; ── Bulma CSS ──
(let [link (.createElement js/document "link")]
  (set! (.-rel link) "stylesheet")
  (set! (.-href link) "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css")
  (.appendChild (.-head js/document) link))

;; ── Custom Styles ──
(let [style (.createElement js/document "style")]
  (set! (.-textContent style)
    (str "html, body { overflow: auto !important; height: 100%; }"
         ".verse-current { background: #e3edf7 !important; border-left: 3px solid #3498db; }"
         ".highlighted { background: #fff3a8 !important; }"
         ".verse-current.highlighted { background: #c8e6c9 !important; border-left: 3px solid #2e7d32; }"
         "mark { background: #ffb6c1; border-radius: 2px; padding: 0 1px; }"))
  (.appendChild (.-head js/document) style))

;; ── Books & Chapter Counts ──
(def books-list
  ["Genesis" "Exodus" "Leviticus" "Numbers" "Deuteronomy" "Joshua" "Judges" "Ruth"
   "1 Samuel" "2 Samuel" "1 Kings" "2 Kings" "1 Chronicles" "2 Chronicles" "Ezra"
   "Nehemiah" "Esther" "Job" "Psalm" "Proverbs" "Ecclesiastes" "Song of Solomon"
   "Isaiah" "Jeremiah" "Lamentations" "Ezekiel" "Daniel" "Hosea" "Joel" "Amos"
   "Obadiah" "Jonah" "Micah" "Nahum" "Habakkuk" "Zephaniah" "Haggai" "Zechariah"
   "Malachi" "Matthew" "Mark" "Luke" "John" "Acts" "Romans" "1 Corinthians"
   "2 Corinthians" "Galatians" "Ephesians" "Philippians" "Colossians"
   "1 Thessalonians" "2 Thessalonians" "1 Timothy" "2 Timothy" "Titus" "Philemon"
   "Hebrews" "James" "1 Peter" "2 Peter" "1 John" "2 John" "3 John" "Jude" "Revelation"])

(def chapter-counts
  {"Genesis" 50 "Exodus" 40 "Leviticus" 27 "Numbers" 36 "Deuteronomy" 34
   "Joshua" 24 "Judges" 21 "Ruth" 4 "1 Samuel" 31 "2 Samuel" 24 "1 Kings" 22
   "2 Kings" 25 "1 Chronicles" 29 "2 Chronicles" 36 "Ezra" 10 "Nehemiah" 13
   "Esther" 10 "Job" 42 "Psalm" 150 "Proverbs" 31 "Ecclesiastes" 12
   "Song of Solomon" 8 "Isaiah" 66 "Jeremiah" 52 "Lamentations" 5 "Ezekiel" 48
   "Daniel" 12 "Hosea" 14 "Joel" 3 "Amos" 9 "Obadiah" 1 "Jonah" 4 "Micah" 7
   "Nahum" 3 "Habakkuk" 3 "Zephaniah" 3 "Haggai" 2 "Zechariah" 14 "Malachi" 4
   "Matthew" 28 "Mark" 16 "Luke" 24 "John" 21 "Acts" 28 "Romans" 16
   "1 Corinthians" 16 "2 Corinthians" 13 "Galatians" 6 "Ephesians" 6
   "Philippians" 4 "Colossians" 4 "1 Thessalonians" 5 "2 Thessalonians" 3
   "1 Timothy" 6 "2 Timothy" 4 "Titus" 3 "Philemon" 1 "Hebrews" 13 "James" 5
   "1 Peter" 5 "2 Peter" 3 "1 John" 5 "2 John" 1 "3 John" 1 "Jude" 1 "Revelation" 22})

;; ── Database ──
;; Dexie UMD exposes Dexie globally as js/Dexie
(println "Dexie global:" (js* "typeof Dexie"))
(def bible-db (new js/Dexie "BibleDB"))
(.stores (.version bible-db 1)
         (clj->js {:verses "&ref" :highlights "&verseRef" :settings "&keyName"}))

;; ── App State ──
(def app-state
  (atom {:book "Genesis"
         :chapter 1
         :verse 0
         :verses []
         :font-size 18
         :highlights #{}
         :search-term ""
         :search-results []
         :search-idx -1
         :loading false
         :load-progress 0
         :total-books 66
         :count-loaded 0
         :prev-book nil
         :prev-chapter nil
         :prev-verse nil}))

;; ── Helper: filename for a book ──
(defn book->filename [book]
  (str "data/" (.replace book (js/RegExp. " " "g") "_") ".json"))

;; ── Helper: clean display text (strip *p *i *ln *pn *bp *iln *s etc) ──
(defn clean-text [s]
  (if (string? s)
    (.replace s (js/RegExp. "\\*[a-z]+" "g") "")
    s))

;; ── Highlight search-term matches within text, returns hiccup ──
(defn highlight-matches [text term]
  "Wrap occurrences of term in text with <mark> tags, case-insensitive.
   Returns text unchanged if no match, or a [:span ...] hiccup vector."
  (if (or (empty? term) (not (string? text)))
    text
    (let [lo (.toLowerCase text)
          lt (.toLowerCase term)
          tl (count term)]
      (loop [start 0
             parts []]
        (if (>= start (count text))
          (if (== (count parts) 1) (first parts) (into [:span] parts))
          (let [idx (.indexOf lo lt start)]
            (if (neg? idx)
              (recur (count text) (conj parts (.substring text start)))
              (let [parts (if (> idx start)
                            (conj parts (.substring text start idx))
                            parts)
                    parts (conj parts [:mark (.substring text idx (+ idx tl))])]
                (recur (+ idx tl) parts)))))))))

;; ── Text-to-speech: read current verse aloud ──
(defn read-verse! []
  (let [verses (:verses @app-state)
        idx (:verse @app-state)]
    (when (and (seq verses) (>= idx 0) (< idx (count verses)))
      (let [text (:t (nth verses idx))]
        (.cancel js/speechSynthesis)
        (let [utterance (new js/SpeechSynthesisUtterance text)]
          (.speak js/speechSynthesis utterance))))))

;; ── Yank verse to clipboard ──
(defn yank-verse! []
  (let [verses (:verses @app-state)
        idx (:verse @app-state)
        book (:book @app-state)
        ch (:chapter @app-state)]
    (when (and (seq verses) (>= idx 0) (< idx (count verses)))
      (let [v (nth verses idx)
            vnum (:v v)
            text (:t v)
            ref (str book " " ch ":" vnum)]
        (.writeText (.-clipboard js/navigator) (str ref " - " text))))))

;; ── Helper: get book index ──
(defn book-index [book]
  (let [idx (.indexOf books-list book)]
    (if (>= idx 0) idx 0)))

;; ── Helper: get chapter count ──
(defn get-chapter-count [book]
  (get chapter-counts book 1))

;; ── Load a single book's JSON, group by chapter, store in Dexie ──
(defn load-book! [book]
  (let [filename (book->filename book)]
    (-> (js/fetch filename)
        (.then (fn [resp]
                 (if (.-ok resp)
                   (.json resp)
                   (throw (js/Error. (str "Failed to load " book ": HTTP " (.-status resp)))))))
        (.then (fn [data]
                 (let [arr data
                       grouped (group-by :c arr)
                       entries (map (fn [[ch verses]]
                                      {:ref (str book ":" ch)
                                       :book book
                                       :chapter (int ch)
                                       :verses (map (fn [v]
                                                      {:v (int (:v v))
                                                       :t (clean-text (:t v))
                                                       :h (int (:h v))})
                                                    verses)})
                                    grouped)]
                   (-> (.bulkPut (.-verses bible-db) (clj->js entries))
                       (.then (fn []
                                (swap! app-state update :count-loaded inc)
                                (println "Loaded" book (count entries) "chapters")))))))
        (.catch (fn [err] (js/console.error "Failed to load" book err))))))

;; ── Save/restore verse position ──
(defn save-verse-pos! []
  (let [{:keys [book chapter verse]} @app-state]
    (let [key (str "pos:" book ":" chapter)]
      (.put (.-settings bible-db) (clj->js {:keyName key :value (str verse)})))))

(defn restore-verse-pos! [book ch]
  (let [key (str "pos:" book ":" ch)]
    (-> (.get (.-settings bible-db) key)
        (.then (fn [row]
                 (when row
                   (let [verse-idx (js/parseInt (.-value row) 10)
                         verses (:verses @app-state)]
                     (when (and (seq verses) (>= verse-idx 0) (< verse-idx (count verses)))
                       (swap! app-state assoc :verse verse-idx)
                       (let [verse-num (:v (nth verses verse-idx))
                             el (.getElementById js/document (str "v" verse-num))]
                         (when el (.scrollIntoView el #js {:behavior "instant" :block "center"})))
                       (println "Restored verse position:" book ch "verse" verse-idx)))))))))

;; ── Load highlights from Dexie ──
(defn load-highlights! []
  (-> (.toArray (.-highlights bible-db))
      (.then (fn [rows]
               (let [hs (set (map #(.-verseRef %) rows))]
                 (swap! app-state assoc :highlights hs)
                 (println "Loaded" (count hs) "highlights"))))))

;; ── Load settings from Dexie ──
(defn load-settings! []
  (-> (.toArray (.-settings bible-db))
      (.then (fn [rows]
               (doseq [row rows]
                 (let [k (keyword (.-keyName row))
                       v (.-value row)]
                   (cond
                     (= k :font-size)
                     (swap! app-state assoc :font-size (js/parseInt v 10))
                     (= k :last-book)
                     (swap! app-state assoc :saved-book v)
                     (= k :last-chapter)
                     (swap! app-state assoc :saved-chapter (js/parseInt v 10)))))
               (println "Settings loaded")))))

;; ── Save a setting ──
(defn save-setting! [k v]
  (.put (.-settings bible-db) (clj->js {:keyName (name k) :value (str v)})))

;; ── Load verses for a given book+chapter from Dexie ──
(defn load-chapter! [book ch]
  (let [ref (str book ":" ch)]
    (-> (.get (.-verses bible-db) ref)
        (.then (fn [row]
                 (if row
                   (let [verses (.-verses row)
                         ;; BUG 2 FIX: find first non-heading verse (h=0) instead of always 0
                         ;; Use aget because Dexie returns raw JS objects, not CLJS maps
                         first-verse-idx (or (first (keep-indexed #(when (zero? (aget %2 "h")) %1) verses)) 0)]
                     (swap! app-state assoc
                            :book book :chapter ch :verse first-verse-idx :verses verses)
                     (println "Displaying" book ch "-" (count verses) "entries (first verse idx:" first-verse-idx ")")
                     (restore-verse-pos! book ch))
                   (do (println "Chapter not found in DB, loading book first...")
                       (-> (load-book! book)
                           (.then (fn [] (load-chapter! book ch)))))))))))

;; ── Navigate to a verse ──
(defn goto-verse! [idx]
  (let [verses (:verses @app-state)
        n (count verses)]
    (when (> n 0)
      (let [i (max 0 (min (dec n) idx))]
        (swap! app-state assoc :verse i))
      ;; MILESTONE 1: Defer scrollIntoView with requestAnimationFrame so the
      ;; atom-watch re-render completes DOM rebuild FIRST, eliminating flicker.
      (js/requestAnimationFrame
        (fn []
          (let [verse-num (get-in @app-state [:verses (:verse @app-state) :v])
                el (.getElementById js/document (str "v" verse-num))]
            (when el (.scrollIntoView el #js {:behavior "instant" :block "center"}))))))))

;; ── Next/previous verse ──
(defn next-verse! []
  (let [idx (:verse @app-state)
        cnt (count (:verses @app-state))]
    (when (< (inc idx) cnt)
      (goto-verse! (inc idx))
      (save-verse-pos!))))

(defn prev-verse! []
  (let [idx (:verse @app-state)]
    (when (> idx 0)
      (goto-verse! (dec idx))
      (save-verse-pos!))))

;; ── Navigate chapters ──
(defn goto-chapter! [ch]
  (let [book (:book @app-state)
        max-ch (get-chapter-count book)]
    (when (and (>= ch 1) (<= ch max-ch))
      (swap! app-state assoc :chapter ch :verse 0 :verses [] :search-term "" :search-results [] :search-idx -1)
      (save-setting! :last-book book)
      (save-setting! :last-chapter (str ch))
      (load-chapter! book ch))))

;; ── Goto book ──
(defn goto-book! [book]
  "Jump to a specific book at chapter 1. Resets search and verse position."
  (when (contains? chapter-counts book)
    (swap! app-state assoc :book book :chapter 1 :verse 0 :verses [] :search-term "" :search-results [] :search-idx -1)
    (save-setting! :last-book book)
    (save-setting! :last-chapter "1")
    (load-chapter! book 1)
    (println "Switched to" book)))

(defn next-chapter! []
  (let [book (:book @app-state)
        ch (:chapter @app-state)
        max-ch (get-chapter-count book)]
    (if (< ch max-ch)
      (goto-chapter! (inc ch))
      ;; wrap to next book
      (let [bi (book-index book)]
        (when (< (inc bi) (count books-list))
          (let [next-book (nth books-list (inc bi))]
            (swap! app-state assoc :book next-book)
            (goto-chapter! 1)))))))

(defn prev-chapter! []
  (let [book (:book @app-state)
        ch (:chapter @app-state)]
    (if (> ch 1)
      (goto-chapter! (dec ch))
      ;; wrap to previous book
      (let [bi (book-index book)]
        (when (> bi 0)
          (let [prev-book (nth books-list (dec bi))
                max-ch (get-chapter-count prev-book)]
            (swap! app-state assoc :book prev-book)
            (goto-chapter! max-ch)))))))

;; ── Scroll helpers ──
(defn scroll-half-down! []
  (.scrollBy js/window 0 (int (/ (.-innerHeight js/window) 2))))

(defn scroll-half-up! []
  (.scrollBy js/window 0 (int (/ (.-innerHeight js/window) -2))))

(defn scroll-full-down! []
  (.scrollBy js/window 0 (.-innerHeight js/window)))

(defn scroll-full-up! []
  (.scrollBy js/window 0 (- (.-innerHeight js/window))))

;; ── Update current verse from viewport position ──
(defn update-current-verse-from-viewport! []
  (let [verse-els (.querySelectorAll js/document "[id^=v]")
        viewport-center (/ (.-innerHeight js/window) 2)
        closest (atom nil)
        closest-dist (atom ##Inf)]
    (dotimes [i (.-length verse-els)]
      (let [el (.item verse-els i)
            rect (.getBoundingClientRect el)
            el-center (+ (.-top rect) (/ (.-height rect) 2))
            dist (js/Math.abs (- el-center viewport-center))]
        (when (< dist @closest-dist)
          (reset! closest-dist dist)
          (reset! closest el))))
    (when-let [closest-el @closest]
      (let [verse-num (js/parseInt (.substring (.-id closest-el) 1) 10)
            verses (:verses @app-state)
            idx (first (keep-indexed #(when (= (:v %2) verse-num) %1) verses))]
        (when idx
          (swap! app-state assoc :verse idx)
          (save-verse-pos!))))))

;; ── Go to top of chapter ──
(defn goto-top! []
  "Jump to first non-heading verse (h=0) and scroll it to center of viewport."
  (let [verses (:verses @app-state)]
    (when (seq verses)
      ;; BUG 4 FIX: skip heading verses, go to first non-heading verse
      ;; Use aget because verses may be raw JS objects from Dexie
      (let [first-non-heading (first (keep-indexed #(when (zero? (aget %2 "h")) %1) verses))]
        (goto-verse! (or first-non-heading 0))))))

;; ── Random chapter ──
(defn random-chapter! []
  "Navigate to a random book and chapter."
  (let [book (nth books-list (rand-int (count books-list)))
        max-ch (get-chapter-count book)
        ch (inc (rand-int max-ch))]
    (swap! app-state assoc :book book :chapter ch :verse 0 :verses [] :search-term "" :search-results [] :search-idx -1)
    (save-setting! :last-book book)
    (save-setting! :last-chapter (str ch))
    (load-chapter! book ch)
    (println "Random pick:" book ch)))

(defn goto-bottom! []
  (let [verses (:verses @app-state)]
    (when (seq verses)
      (goto-verse! (dec (count verses))))))

(defn goto-verse-num! [verse-num]
  (let [verses (:verses @app-state)]
    (if (seq verses)
      (let [idx (first (keep-indexed
                         (fn [i v] (when (= (:v v) verse-num) i))
                         verses))]
        (if idx
          (do (goto-verse! idx)
              (save-verse-pos!)
              (println "Jumped to verse" verse-num))
          (println "Verse" verse-num "not found in this chapter")))
      (println "No verses loaded"))))

;; ── Parse & navigate to a Bible reference string ──
;; Supports: "John 3:16", "1 John 1:9", "Genesis 1", "Song of Solomon 2:3", "Psalm 119"
(defn goto-reference! [ref-str]
  (if (or (nil? ref-str) (empty? (clojure.string/trim ref-str)))
    (println "Usage: (goto-reference! \"Book Chapter:Verse\") e.g. \"John 3:16\"")
    (let [s (clojure.string/trim ref-str)
          ;; Find the longest book name that matches the start of the string.
          ;; Sort descending by length so "Song of Solomon" matches before "Song".
          candidates (->> books-list
                          (filter #(let [lo-ref (.toLowerCase s)
                                         lo-book (.toLowerCase %)]
                                     (.startsWith lo-ref lo-book)))
                          (sort-by count >))
          book (first candidates)]
      (if (nil? book)
        (println "Book not recognized in:" (pr-str s))
        (let [;; Strip the book name from the front; remainder is " 3:16" or " 3"
              remainder (clojure.string/trim (.substring s (count book)))
              ;; Split on colon: ["3", "16"] or just ["3"]
              parts (clojure.string/split remainder #":")
              ch-str (first parts)
              verse-str (second parts)
              ch (when ch-str (js/parseInt ch-str 10))
              verse-num (when verse-str (js/parseInt verse-str 10))
              max-ch (get-chapter-count book)]
          (cond
            (or (nil? ch) (not (>= ch 1)))
            (println "Invalid reference:" (pr-str s) "- could not parse chapter")
            (> ch max-ch)
            (println book "has only" max-ch "chapters, not" ch)
            :else
            (do
              (println "Navigating to" book ch (if verse-num (str ":" verse-num) ""))
              (if (or (not= book (:book @app-state))
                      (not= ch (:chapter @app-state)))
                ;; Need to load a different book/chapter; defer verse jump until loaded
                (do
                  (swap! app-state assoc
                         :book book :chapter ch :verse 0 :verses []
                         :search-term "" :search-results [] :search-idx -1)
                  (-> (load-chapter! book ch)
                      (.then (fn []
                               (when verse-num
                                 (js/setTimeout #(goto-verse-num! verse-num) 100))))))
                ;; Same chapter, just jump verse
                (when verse-num
                  (goto-verse-num! verse-num))))))))))


;; ── Search Google for current verse ──
(defn search-verse! []
  (let [verses (:verses @app-state) idx (:verse @app-state)
        book (:book @app-state) ch (:chapter @app-state)]
    (when (and (seq verses) (>= idx 0) (< idx (count verses)))
      (let [v (nth verses idx) text (:t v) vnum (:v v)
            ref (str book " " ch ":" vnum)
            query (js/encodeURIComponent (str "Explain this verse: " ref " - " text))]
        (.open js/window (str "https://www.google.com/search?q=" query) "_blank")))))

;; ── Toggle verse position: % key swaps current ↔ previous verse position ──
(defn toggle-verse-position! []
  (let [{:keys [book chapter verse prev-book prev-chapter prev-verse]} @app-state]
    (if (nil? prev-verse)
      ;; First press: save current position as previous
      (swap! app-state assoc
             :prev-book book
             :prev-chapter chapter
             :prev-verse verse)
      ;; Second press: swap current and previous
      (let [temp-book book
            temp-chapter chapter
            temp-verse verse]
        (swap! app-state assoc
               :book prev-book
               :chapter prev-chapter
               :verse prev-verse
               :verses []
               :prev-book temp-book
               :prev-chapter temp-chapter
               :prev-verse temp-verse)
        (load-chapter! prev-book prev-chapter)))))

;; ── Toggle highlight on a verse ──
(defn toggle-highlight! [verse-num]
  (let [book (:book @app-state)
        ch (:chapter @app-state)
        ref (str book ":" ch ":" verse-num)
        hs (:highlights @app-state)]
    (if (contains? hs ref)
      (do (.delete (.-highlights bible-db) ref)
          (swap! app-state update :highlights disj ref))
      (do (.put (.-highlights bible-db) (clj->js {:verseRef ref}))
          (swap! app-state update :highlights conj ref)))))

;; ── Font size ──
(defn change-font-size! [delta]
  (let [new-sz (+ (:font-size @app-state) delta)]
    (when (and (>= new-sz 10) (<= new-sz 48))
      (swap! app-state assoc :font-size new-sz)
      (save-setting! :font-size new-sz))))

;; ── Search ──
(defn do-search! [term]
  (let [term (or term "")
        verses (:verses @app-state)]
    (if (empty? term)
      (swap! app-state assoc :search-term "" :search-results [] :search-idx -1)
      (let [results (keep-indexed
                      (fn [i v]
                        (when (and (= (:h v) 0)
                                   (>= (.indexOf (.toLowerCase (:t v))
                                                 (.toLowerCase term)) 0))
                          i))
                      verses)]
        (swap! app-state assoc
               :search-term term
               :search-results (vec results)
               :search-idx (if (seq results) 0 -1))
        (when (seq results)
          (goto-verse! (first results)))))))

(defn search-next! []
  (let [results (:search-results @app-state)
        idx (:search-idx @app-state)]
    (when (seq results)
      (let [new-idx (mod (inc idx) (count results))]
        (swap! app-state assoc :search-idx new-idx)
        (goto-verse! (nth results new-idx))))))

(defn search-prev! []
  (let [results (:search-results @app-state)
        idx (:search-idx @app-state)]
    (when (seq results)
      (let [new-idx (mod (dec idx) (count results))]
        (swap! app-state assoc :search-idx new-idx)
        (goto-verse! (nth results new-idx))))))

(defn clear-search! []
  (swap! app-state assoc :search-term "" :search-results [] :search-idx -1))

;; ── Load All Books ──
(defn load-all! []
  (swap! app-state assoc :loading true :load-progress 0 :count-loaded 0)
  ;; First count how many are already cached
  (-> (.toArray (.-verses bible-db))
      (.then (fn [rows]
               (let [cached (set (map #(.-book %) rows))
                     to-load (filter #(not (contains? cached %)) books-list)
                     total (count to-load)]
                 (swap! app-state assoc :total-books total)
                 (if (zero? total)
                   (do (swap! app-state assoc :loading false :load-progress 100)
                       (println "All books already cached!"))
                   (let [load-next (fn load-next [remaining]
                                     (if (empty? remaining)
                                       (do (swap! app-state assoc :loading false :load-progress 100)
                                           (println "All books loaded!"))
                                       (let [book (first remaining)
                                             pct (int (* 100 (/ (- total (count remaining)) (max 1 total))))]
                                         (swap! app-state assoc :load-progress pct)
                                         (-> (load-book! book)
                                             (.then (fn []
                                                      (swap! app-state update :load-progress
                                                             (fn [_] (int (* 100 (/ (- total (count (rest remaining))) (max 1 total))))))
                                                      (load-next (rest remaining))))
                                             (.catch (fn [err]
                                                       (js/console.error "Error loading" book err)
                                                       (load-next (rest remaining))))))))]
                     (load-next to-load))))))))

;; ── Render: verse row ──
(defn render-verse-row [v idx font-size highlights book chapter current-verse-num search-term]
  (let [verse-num (:v v)
        text (:t v)
        is-heading (> (:h v) 0)
        ref (str book ":" chapter ":" verse-num)
        highlighted (contains? highlights ref)
        is-current (= verse-num current-verse-num)]
    (if is-heading
      [:div {:style "padding: 8px 16px; margin-top: 4px;"
             :class "has-text-weight-bold has-text-centered is-size-5"}
       text]
      [:div {:id (str "v" verse-num)
             :onclick (fn [_] (toggle-highlight! verse-num))
              :class (str (when is-current "verse-current") (when highlighted " highlighted"))
             :style (str "display: flex; padding: 4px 8px; cursor: pointer; border-bottom: 1px solid #eee;")}
       [:div {:style (str "color: #aaa; text-align: right; min-width: 48px; padding-right: 12px; font-size: " (- font-size 2) "px; user-select: none;")}
        verse-num]
       [:div {:style (str "font-size: " font-size "px; flex: 1;")}
        (highlight-matches text search-term)]])))

;; ── Render: verse list ──
(defn render-verses []
  (let [{:keys [verses font-size highlights book chapter verse search-term]} @app-state
        current-verse-num (when (and (seq verses) (>= verse 0) (< verse (count verses)))
                            (:v (nth verses verse)))]
    (if (empty? verses)
      [:div {:class "notification is-info"} "Loading..."]
      (into [:div]
            (map-indexed (fn [idx v]
                           (render-verse-row v idx font-size highlights book chapter current-verse-num search-term))
                         verses)))))

;; ── Render: Navbar ──
(defn render-navbar []
  (let [{:keys [book chapter font-size]} @app-state
        book-chapters (range 1 (inc (get-chapter-count book)))
        ;; Shared button hiccups
        font-minus-btn [:button {:class "button is-small is-light"
                                 :onclick (fn [_] (change-font-size! -2))
                                 :title "Decrease font"} "A-"]
        font-plus-btn  [:button {:class "button is-small is-light"
                                 :onclick (fn [_] (change-font-size! 2))
                                 :title "Increase font"} "A+"]
        speaker-btn    [:button {:class "button is-small is-light"
                                 :onclick (fn [_] (read-verse!))
                                 :title "Read verse aloud (R)"} "🔊"]
        search-btn     [:button {:class "button is-small is-info"
                                 :onclick (fn [_]
                                            (let [input (.getElementById js/document "search-input")]
                                              (when input (.focus input) (.select input))))}
                        "🔍"]
        load-book-btn  [:button {:class "button is-small is-primary"
                                 :onclick (fn [_] (load-book! book))} "Load Book"]
        load-all-btn   [:button {:class "button is-small is-warning"
                                 :onclick (fn [_] (load-all!))} "Load All"]
        ;; Helper: wrap button in navbar-item div
        wrap-btn (fn [btn] [:div {:class "navbar-item" :style "padding: 4px;"} btn])
        ;; Book select – use into for options
        book-select [:div {:class "navbar-item" :style "padding: 4px;"}
                     [:div {:class "select is-small"}
                      (into [:select {:value book
                                      :onchange (fn [e]
                                                  (let [new-book (.. e -target -value)]
                                                    (swap! app-state assoc :book new-book :chapter 1 :verse 0 :verses [] :search-term "" :search-results [] :search-idx -1)
                                                    (load-chapter! new-book 1)))}]
                            (mapv (fn [b] [:option {:value b :key b} b]) books-list))]]
        ;; Chapter select – use into for options
        chapter-select [:div {:class "navbar-item" :style "padding: 4px;"}
                        [:div {:class "select is-small"}
                         (into [:select {:value (str chapter)
                                         :onchange (fn [e]
                                                     (let [new-ch (js/parseInt (.. e -target -value) 10)]
                                                       (goto-chapter! new-ch)))}]
                               (mapv (fn [c] [:option {:value (str c) :key c} c]) book-chapters))]]
        ;; Shared nav-brand
        nav-brand [:div {:class "navbar-brand" :style "min-height: 48px;"}
                   [:span {:class "navbar-item" :style "font-weight: bold; padding: 0 12px; height: 48px;"}
                    "NASB"]]]
    ;; Compose top-level div using into
    (into
     [:div]
     [;; ── DESKTOP navbar: single row with all controls (hidden on touch) ──
      [:nav {:class "navbar is-dark is-fixed-top is-hidden-touch"
             :style "height: 48px; min-height: 48px;"}
       nav-brand
       [:div {:class "navbar-menu is-active" :style "height: 48px;"}
        (into [:div {:class "navbar-start" :style "height: 48px; align-items: center;"}]
              [book-select
               chapter-select
               (wrap-btn font-minus-btn)
               (wrap-btn font-plus-btn)
               (wrap-btn speaker-btn)
               (wrap-btn search-btn)
               (wrap-btn load-book-btn)
               (wrap-btn load-all-btn)])]]
      ;; ── MOBILE first navbar: book/chapter + Load Book/Load All ──
      [:nav {:class "navbar is-dark is-hidden-desktop"
             :style "height: 48px; min-height: 48px; position: fixed; top: 0; left: 0; right: 0; z-index: 31;"}
       nav-brand
       [:div {:class "navbar-menu is-active" :style "height: 48px;"}
        (into [:div {:class "navbar-start" :style "height: 48px; align-items: center;"}]
              [book-select
               chapter-select
               (wrap-btn load-book-btn)
               (wrap-btn load-all-btn)])]]
      ;; ── MOBILE second navbar: Font A-/A+/Speaker/Search (fixed below first) ──
      [:nav {:class "navbar is-dark is-hidden-desktop"
             :style "height: 48px; min-height: 48px; position: fixed; top: 48px; left: 0; right: 0; z-index: 30;"}
       [:div {:class "navbar-menu is-active" :style "height: 48px;"}
        (into [:div {:class "navbar-start" :style "height: 48px; align-items: center;"}]
              [(wrap-btn font-minus-btn)
               (wrap-btn font-plus-btn)
               (wrap-btn speaker-btn)
               (wrap-btn search-btn)])]]])))

;; ── Render: Search bar ──
;; Wrapped in desktop/mobile containers so margin-top adapts to 1 vs 2 navbars.
(defn render-search-bar []
  (let [{:keys [search-term search-results search-idx]} @app-state
        input-el [:input {:id "search-input"
                          :class "input is-small"
                          :type "text"
                          :placeholder "Search current chapter... (n/N to navigate)"
                          :value search-term
                          :style "max-width: 400px;"
                          :oninput (fn [e] (do-search! (.. e -target -value)))
                          :onkeydown (fn [e]
                                       (when (= (.-key e) "Enter")
                                         (search-next!)
                                         (.preventDefault e))
                                       (when (= (.-key e) "Escape")
                                         (clear-search!)
                                         (.blur (.. e -target))))}]
        results-tag (when (seq search-results)
                      [:span {:class "tag is-info"}
                       (str (inc search-idx) "/" (count search-results))])]
    ;; Desktop: single navbar = 48px margin. Mobile: two navbars = 96px margin.
    (into [:div]
          [[:div {:class "is-hidden-touch"
                  :style "padding: 4px 8px; margin-top: 48px; display: flex; gap: 8px; align-items: center;"}
            input-el results-tag]
           [:div {:class "is-hidden-desktop"
                  :style "padding: 4px 8px; margin-top: 96px; display: flex; gap: 8px; align-items: center;"}
            input-el results-tag]])))

;; ── Render: Progress overlay ──
(defn render-progress-overlay []
  (let [{:keys [loading load-progress total-books]} @app-state]
    (when loading
      [:div {:style "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;"}
       [:div {:style "background: white; padding: 24px; border-radius: 8px; min-width: 300px; text-align: center;"}
        [:p {:class "is-size-5 mb-4"} "Loading all books..."]
        [:progress {:class "progress is-primary"
                    :value load-progress
                    :max "100"
                    :style "width: 100%;"}
         (str load-progress "%")]
        [:p {:style "margin-top: 8px;"} (str load-progress "%")]]])))

;; ── Render: Status bar ──
(defn render-status-bar []
  (let [{:keys [book chapter verse verses highlights search-results search-term font-size]} @app-state
        total-verses (count (filter (fn [v] (= (:h v) 0)) verses))]
    [:div {:style "position: fixed; bottom: 0; left: 0; right: 0; background: #f5f5f5; border-top: 1px solid #ddd; padding: 4px 12px; font-size: 12px; display: flex; justify-content: space-between; z-index: 50;"}
     [:span (str book " " chapter " | " (when (> (count verses) 0) (str "Verse " (inc verse) "/" (count verses) " | ")) "Font: " font-size "px")]
     [:span (str (count highlights) " highlights"
                 (when (seq search-results) (str " | Search: " (inc (:search-idx @app-state)) "/" (count search-results))))]
     [:span "j/k verse | h/l chapter | gg/G top/bot | / search | n/N next/prev match | Ctrl+d/u scroll | Ctrl+=/- font"]]))

;; ── Render: Main UI ──
(defn render-ui []
  (let [el (.getElementById js/document "app")]
    (when el
      ;; BUG 1 FIX: Save scrollTop of the verse container (overflow-y:auto div)
      ;; instead of window.scrollY, since scrolling happens inside that container.
      (let [verse-container (.querySelector js/document "[style*=\"overflow-y\"]")
            scroll-top (if verse-container (.-scrollTop verse-container) 0)]
        (set! (.-innerHTML el) "")
        (rg/render el
          [:div
           (render-navbar)
           (render-search-bar)
           [:div {:style "margin-top: 8px; padding: 0 8px 60px 8px; overflow-y: auto; height: calc(100vh - 200px);"}
            (render-verses)]
           (render-progress-overlay)
           (render-status-bar)])
        ;; Restore scrollTop on the new verse container after DOM is rebuilt
        (let [new-container (.querySelector js/document "[style*=\"overflow-y\"]")]
          (when new-container
            (set! (.-scrollTop new-container) scroll-top)))
        ;; Sync select .value after reagami render with a short delay.
        ;; reagami sets the HTML value attribute, but the browser only respects
        ;; the .value property on <select> after re-render. setTimeout ensures DOM is ready.
        (js/setTimeout (fn []
          (let [book-sel (.querySelector js/document "select")]
            (when book-sel (set! (.-value book-sel) (:book @app-state))))
          (let [sels (.querySelectorAll js/document "select")]
            (when (and sels (>= (.-length sels) 2))
              (set! (.-value (aget sels 1)) (str (:chapter @app-state)))))) 50)))))

;; ── Force re-render ──
(defn rerender! []
  (render-ui))

;; ── Vim key handling ──
(defn handle-keydown [e]
  (let [tag (.. e -target -tagName)
        tag-upper (when tag (.toUpperCase tag))]
    ;; Skip when target is input/textarea/select
    (when (not (contains? #{"INPUT" "TEXTAREA" "SELECT"} tag-upper))
      (let [key (.-key e)]
        (cond
          ;; j - next verse
          (= key "j") (do (.preventDefault e) (next-verse!))
          ;; k - previous verse
          (= key "k") (do (.preventDefault e) (prev-verse!))
          ;; Enter - scroll half page down
          (= key "Enter") (do (.preventDefault e) (scroll-half-down!) (update-current-verse-from-viewport!))
          ;; Backspace - scroll half page up
          (= key "Backspace") (do (.preventDefault e) (scroll-half-up!) (update-current-verse-from-viewport!))
          ;; Space - toggle highlight on current verse
          (= key " ") (do
                        (.preventDefault e)
                        (let [verses (:verses @app-state)
                              idx (:verse @app-state)]
                          (when (and (seq verses) (>= idx 0) (< idx (count verses)))
                            (let [v (nth verses idx)
                                  vnum (:v v)]
                              (when vnum
                                (toggle-highlight! vnum))))))
          ;; % - toggle between current and previous verse position
          (= key "%") (do (.preventDefault e) (toggle-verse-position!))
          ;; R or o - read verse aloud
          (or (= key "R") (= key "o")) (do (.preventDefault e) (read-verse!))
          ;; h - previous chapter
          (= key "h") (do (.preventDefault e) (prev-chapter!))
          ;; l - next chapter
          (= key "l") (do (.preventDefault e) (next-chapter!))
          ;; / - focus search
          (= key "/") (do
                        (.preventDefault e)
                        (let [input (.getElementById js/document "search-input")]
                          (when input
                            (.focus input)
                            (set! (.-value input) "")
                            (clear-search!))))
          ;; n / N - search navigation
          (= key "n") (do (.preventDefault e) (search-next!))
          (= key "N") (do (.preventDefault e) (search-prev!))
          ;; G / Shift+G
          (= key "G") (do (.preventDefault e) (goto-bottom!))
          ;; z - start of z-command sequence (zz, zt, zb)
          (= key "z") (do
                        (.preventDefault e)
                        (let [now (.now js/Date)]
                          (if-let [last-z (.-_lastZKey js/window)]
                            ;; Second 'z' → zz: scroll current verse to center
                            (do
                              (when (< (- now last-z) 500)
                                (let [v (:verse @app-state)
                                      verses (:verses @app-state)
                                      verse-num (when (and (seq verses) (>= v 0) (< v (count verses)))
                                                  (:v (nth verses v)))
                                      el (when verse-num (.getElementById js/document (str "v" verse-num)))]
                                  (when el (js/requestAnimationFrame
                                             (fn [] (.scrollIntoView el #js {:behavior "instant" :block "center"}))))))
                              (set! (.-_lastZKey js/window) 0))
                            ;; First 'z': start timer; default single-z = zt (scroll to top)
                            (do
                              (set! (.-_lastZKey js/window) now)
                              (js/setTimeout
                                (fn []
                                  (when (= (.-_lastZKey js/window) now)
                                    (let [v (:verse @app-state)
                                          verses (:verses @app-state)
                                          verse-num (when (and (seq verses) (>= v 0) (< v (count verses)))
                                                      (:v (nth verses v)))
                                          el (when verse-num (.getElementById js/document (str "v" verse-num)))]
                                      (when el (js/requestAnimationFrame
                                                 (fn [] (.scrollIntoView el #js {:behavior "instant" :block "start"})))))
                                    (set! (.-_lastZKey js/window) 0)))
                                500)))))
          ;; t - go to first verse; or zt: scroll current verse to top
          (= key "t") (if-let [last-z (.-_lastZKey js/window)]
                        (if (< (- (.now js/Date) last-z) 500)
                          (do
                            (.preventDefault e)
                            (let [v (:verse @app-state)
                                  verses (:verses @app-state)
                                  verse-num (when (and (seq verses) (>= v 0) (< v (count verses)))
                                              (:v (nth verses v)))
                                  el (when verse-num (.getElementById js/document (str "v" verse-num)))]
                              (when el (js/requestAnimationFrame
                                         (fn [] (.scrollIntoView el #js {:behavior "instant" :block "start"})))))
                            (set! (.-_lastZKey js/window) 0)
                            true)
                          ;; stale z-prefix: clear it and fall through to standalone goto-top!
                          (do (set! (.-_lastZKey js/window) 0)
                              (.preventDefault e)
                              (goto-top!)))
                        (do (.preventDefault e) (goto-top!)))
          ;; b after z → zb: scroll current verse to bottom; standalone b → last verse
          (= key "b") (if-let [last-z (.-_lastZKey js/window)]
                        (if (< (- (.now js/Date) last-z) 500)
                          (do
                            (.preventDefault e)
                            (let [v (:verse @app-state)
                                  verses (:verses @app-state)
                                  verse-num (when (and (seq verses) (>= v 0) (< v (count verses)))
                                              (:v (nth verses v)))
                                  el (when verse-num (.getElementById js/document (str "v" verse-num)))]
                              (when el (js/requestAnimationFrame
                                         (fn [] (.scrollIntoView el #js {:behavior "instant" :block "end"})))))
                            (set! (.-_lastZKey js/window) 0)
                            true)
                          ;; stale z-prefix: clear it and fall through to standalone goto-bottom!
                          (do (set! (.-_lastZKey js/window) 0)
                              (.preventDefault e)
                              (goto-bottom!)))
                        (do (.preventDefault e) (goto-bottom!)))
          ;; y - yy yank verse (double-tap y)
          (= key "y") (do
                        (.preventDefault e)
                        (let [now (.now js/Date)]
                          (if (and (.-_lastYKey js/window) (< (- now (.-_lastYKey js/window)) 500))
                            (do (yank-verse!) (set! (.-_lastYKey js/window) 0))
                            (set! (.-_lastYKey js/window) now))))
          ;; g - start of gg sequence
          (= key "g") (do
                        (.preventDefault e)
                        (let [now (.now js/Date)]
                          (if-let [last-g (.-_lastGKey js/window)]
                            (do
                              (when (< (- now last-g) 500)
                                (goto-top!))
                              (set! (.-_lastGKey js/window) 0))
                            (set! (.-_lastGKey js/window) now))))
          ;; Ctrl shortcuts
          (and (.-ctrlKey e) (= key "d")) (do (.preventDefault e) (scroll-half-down!))
          (and (.-ctrlKey e) (= key "u")) (do (.preventDefault e) (scroll-half-up!))
          (and (.-ctrlKey e) (= key "f")) (do (.preventDefault e) (scroll-full-down!))
          (and (.-ctrlKey e) (= key "b")) (do (.preventDefault e) (scroll-full-up!))
          (and (.-ctrlKey e) (= key "=")) (do (.preventDefault e) (change-font-size! 2))
          (and (.-ctrlKey e) (= key "-")) (do (.preventDefault e) (change-font-size! -2))
          ;; Escape
          (= key "Escape") (do (.preventDefault e) (clear-search!)
                               (let [input (.getElementById js/document "search-input")]
                                 (when input (.blur input))))
          ;; v after number prefix → jump to verse number
          (= key "v") (when-let [np (.-_numberPrefix js/window)]
                        (when (< (- (.now js/Date) (.-ts np)) 700)
                          (.preventDefault e)
                          (let [vnum (js/parseInt (.-digits np) 10)]
                            (when (>= vnum 1)
                              (goto-verse-num! vnum)))
                          (set! (.-_numberPrefix js/window) nil)))
          ;; Number prefix for chapter jump
          (re-matches #"[0-9]" key) (do
                                      (.preventDefault e)
                                      (let [now (.now js/Date)]
                                        (if (.-_numberPrefix js/window)
                                          (let [{:keys [digits ts]} (.-_numberPrefix js/window)]
                                            (if (< (- now ts) 700)
                                              (set! (.-_numberPrefix js/window)
                                                    {:digits (str digits key) :ts now})
                                              (set! (.-_numberPrefix js/window)
                                                    {:digits key :ts now})))
                                          (set! (.-_numberPrefix js/window)
                                                {:digits key :ts now}))
                                        (js/setTimeout
                                          (fn []
                                            (when-let [np (.-_numberPrefix js/window)]
                                              (when (= (.-ts np) now)
                                                (let [ch (js/parseInt (.-digits np) 10)]
                                                  (when (and (>= ch 1) (<= ch (get-chapter-count (:book @app-state))))
                                                    (goto-chapter! ch))
                                                  (set! (.-_numberPrefix js/window) nil)))))
                                          700)))
          ) nil nil))))

;; ── Init ──
(defn init! []
  (println "NASB Bible Reader initializing...")
  ;; Attach key handler
  (set! (.-onkeydown js/document) handle-keydown)
  ;; ── Mobile swipe gestures ──
  (let [startX (atom 0)
        startY (atom 0)]
    (.addEventListener js/document "touchstart"
      (fn [e]
        (when (and e (.-touches e) (pos? (.-length (.-touches e))))
          (let [touch (aget (.-touches e) 0)
                tag (.. e -target -tagName)]
            (when (not (contains? #{"INPUT" "TEXTAREA" "SELECT"} tag))
              (reset! startX (.-clientX touch))
              (reset! startY (.-clientY touch))))))
      #js{:passive true})
    (.addEventListener js/document "touchend"
      (fn [e]
        (when (and e (.-changedTouches e) (pos? (.-length (.-changedTouches e))))
          (let [touch (aget (.-changedTouches e) 0)
                deltaX (- (.-clientX touch) @startX)
                deltaY (- (.-clientY touch) @startY)]
            (when (and (> (js/Math.abs deltaX) 50)
                       (> (js/Math.abs deltaX) (js/Math.abs deltaY)))
              (if (neg? deltaX)
                (next-chapter!)
                (prev-chapter!))))))
      #js{:passive true}))
  ;; Load highlights
  (load-highlights!)
  ;; Load settings, then restore the last book/chapter the user was reading
  ;; (falls back to Genesis 1 if no saved position exists).
  (-> (load-settings!)
      (.then (fn []
               (let [{:keys [saved-book saved-chapter]} @app-state
                     book (if (and saved-book (contains? chapter-counts saved-book))
                            saved-book
                            "Genesis")
                     chapter (if (and saved-chapter (>= saved-chapter 1)
                                      (<= saved-chapter (get-chapter-count book)))
                              saved-chapter
                              1)]
                 (swap! app-state assoc :book book :chapter chapter)
                 (load-chapter! book chapter)
                 (render-ui)
                 (println "Restored last position:" book "chapter" chapter))))
      (.catch (fn [err]
                (js/console.error "Failed to restore last position, loading Genesis 1" err)
                (load-chapter! "Genesis" 1)
                (render-ui))))
  ;; Add watch for auto-rerender
  (add-watch app-state :rerender (fn [_ _ _ _] (render-ui)))
  (println "Initialized!"))

;; ── Export to window.bibleApp ──
(def bible-app-obj
  #js {:appState app-state
       :loadBook load-book!
       :loadAll load-all!
       :gotoChapter goto-chapter!
       :nextVerse next-verse!
       :prevVerse prev-verse!
       :nextChapter next-chapter!
       :prevChapter prev-chapter!
       :toggleHighlight toggle-highlight!
       :changeFontSize change-font-size!
       :doSearch do-search!
       :searchNext search-next!
       :searchPrev search-prev!
       :clearSearch clear-search!
       :gotoTop goto-top!
       :gotoBottom goto-bottom!
       :gotoVerseNum goto-verse-num!
       :randomChapter random-chapter!
       :rerender rerender!
       :init init!})

(set! (.-bibleApp js/window) bible-app-obj)

;; ── Auto-start ──
(init!)