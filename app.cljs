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
  (set! (.-textContent style) ".verse-current { background: #e3edf7 !important; border-left: 3px solid #3498db; }")
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
         :count-loaded 0}))

;; ── Helper: filename for a book ──
(defn book->filename [book]
  (str "data/" (.replace book " " "_") ".json"))

;; ── Helper: clean display text (strip *p *i *ln *pn *bp *iln *s etc) ──
(defn clean-text [s]
  (if (string? s)
    (.replace s (js/RegExp. "\\*[a-z]+" "g") "")
    s))

;; ── Text-to-speech: read current verse aloud ──
(defn read-verse! []
  (let [verses (:verses @app-state)
        idx (:verse @app-state)]
    (when (and (seq verses) (>= idx 0) (< idx (count verses)))
      (let [text (:t (nth verses idx))]
        (.cancel js/speechSynthesis)
        (let [utterance (new js/SpeechSynthesisUtterance text)]
          (.speak js/speechSynthesis utterance))))))

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
        (.then (fn [resp] (.json resp)))
        (.then (fn [data]
                 (let [arr (js->clj data :keywordize-keys true)
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
                         (when el (.scrollIntoView el #js {:behavior "smooth" :block "center"})))
                       (println "Restored verse position:" book ch "verse" verse-idx)))))))))

;; ── Load highlights from Dexie ──
(defn load-highlights! []
  (-> (.toArray (.-highlights bible-db))
      (.then (fn [rows]
               (let [hs (set (map #(.-verseRef %) (js->clj rows)))]
                 (swap! app-state assoc :highlights hs)
                 (println "Loaded" (count hs) "highlights"))))))

;; ── Load settings from Dexie ──
(defn load-settings! []
  (-> (.toArray (.-settings bible-db))
      (.then (fn [rows]
               (doseq [row (js->clj rows)]
                 (let [k (keyword (.-keyName row))
                       v (.-value row)]
                   (when (= k :font-size)
                     (swap! app-state assoc :font-size (js/parseInt v 10)))))
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
                   (let [verses (js->clj (.-verses row) :keywordize-keys true)]
                     (swap! app-state assoc
                            :book book :chapter ch :verse 0 :verses verses)
                     (println "Displaying" book ch "-" (count verses) "entries")
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
      (let [verse-num (get-in @app-state [:verses (:verse @app-state) :v])
            el (.getElementById js/document (str "v" verse-num))]
        (when el (.scrollIntoView el #js {:behavior "smooth" :block "center"}))))))

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
      (load-chapter! book ch))))

;; ── Goto book ──
(defn goto-book! [book]
  "Jump to a specific book at chapter 1. Resets search and verse position."
  (when (contains? chapter-counts book)
    (swap! app-state assoc :book book :chapter 1 :verse 0 :verses [] :search-term "" :search-results [] :search-idx -1)
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

;; ── Go to top/bottom of chapter & specific verse ──
(defn goto-top! []
  (let [verses (:verses @app-state)]
    (when (seq verses)
      (goto-verse! 0))))

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
               (let [cached (set (map #(.-book %) (js->clj rows)))
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
(defn render-verse-row [v idx font-size highlights book chapter current-verse-num]
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
             :class (when is-current "verse-current")
             :style (str "display: flex; padding: 4px 8px; cursor: pointer; border-bottom: 1px solid #eee;"
                         (when highlighted "background-color: #fff3a8;"))}
       [:div {:style (str "color: #aaa; text-align: right; min-width: 48px; padding-right: 12px; font-size: " (- font-size 2) "px; user-select: none;")}
        verse-num]
       [:div {:style (str "font-size: " font-size "px; flex: 1;")}
        text]])))

;; ── Render: verse list ──
(defn render-verses []
  (let [{:keys [verses font-size highlights book chapter verse]} @app-state
        current-verse-num (when (and (seq verses) (>= verse 0) (< verse (count verses)))
                            (:v (nth verses verse)))]
    (if (empty? verses)
      [:div {:class "notification is-info"} "Loading..."]
      (into [:div]
            (map-indexed (fn [idx v]
                           (render-verse-row v idx font-size highlights book chapter current-verse-num))
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
      (set! (.-innerHTML el) "")
      (rg/render el
        [:div
         (render-navbar)
         (render-search-bar)
         [:div {:style "margin-top: 8px; padding: 0 8px 60px 8px;"}
          (render-verses)]
         (render-progress-overlay)
         (render-status-bar)]))))

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
          ;; R - read verse aloud
          (= key "R") (do (.preventDefault e) (read-verse!))
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
                                  (when el (.scrollIntoView el #js {:behavior "smooth" :block "center"}))))
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
                                      (when el (.scrollIntoView el #js {:behavior "smooth" :block "start"})))
                                    (set! (.-_lastZKey js/window) 0)))
                                500)))))
          ;; t after z → zt: scroll current verse to top
          (= key "t") (when-let [last-z (.-_lastZKey js/window)]
                        (when (< (- (.now js/Date) last-z) 500)
                          (.preventDefault e)
                          (let [v (:verse @app-state)
                                verses (:verses @app-state)
                                verse-num (when (and (seq verses) (>= v 0) (< v (count verses)))
                                            (:v (nth verses v)))
                                el (when verse-num (.getElementById js/document (str "v" verse-num)))]
                            (when el (.scrollIntoView el #js {:behavior "smooth" :block "start"})))
                          (set! (.-_lastZKey js/window) 0)
                          true))
          ;; b after z → zb: scroll current verse to bottom
          (= key "b") (when-let [last-z (.-_lastZKey js/window)]
                        (when (< (- (.now js/Date) last-z) 500)
                          (.preventDefault e)
                          (let [v (:verse @app-state)
                                verses (:verses @app-state)
                                verse-num (when (and (seq verses) (>= v 0) (< v (count verses)))
                                            (:v (nth verses v)))
                                el (when verse-num (.getElementById js/document (str "v" verse-num)))]
                            (when el (.scrollIntoView el #js {:behavior "smooth" :block "end"})))
                          (set! (.-_lastZKey js/window) 0)
                          true))
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
  ;; Load settings
  (load-settings!)
  ;; Load Genesis 1
  (load-chapter! "Genesis" 1)
  ;; Render
  (render-ui)
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
       :rerender rerender!
       :init init!})

(set! (.-bibleApp js/window) bible-app-obj)

;; ── Auto-start ──
(init!)