;; ──── NASB Bible Reader ────
;; Libraries
(require '["https://unpkg.com/dexie@3.2.4/dist/dexie.js" :as dexie])
(require '["https://unpkg.com/reagami@0.1.37/reagami.mjs" :as rg])

;; ──── Bulma CSS ────
(let [link (.createElement js/document "link")]
  (set! (.-rel link) "stylesheet")
  (set! (.-href link) "https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css")
  (.appendChild (.-head js/document) link))

;; ──── Manifest ────
(defonce books-manifest
  [["Genesis" "data/Genesis.json" 50]
   ["Exodus" "data/Exodus.json" 40]
   ["Leviticus" "data/Leviticus.json" 27]
   ["Numbers" "data/Numbers.json" 36]
   ["Deuteronomy" "data/Deuteronomy.json" 34]
   ["Joshua" "data/Joshua.json" 24]
   ["Judges" "data/Judges.json" 21]
   ["Ruth" "data/Ruth.json" 4]
   ["1 Samuel" "data/1_Samuel.json" 31]
   ["2 Samuel" "data/2_Samuel.json" 24]
   ["1 Kings" "data/1_Kings.json" 22]
   ["2 Kings" "data/2_Kings.json" 25]
   ["1 Chronicles" "data/1_Chronicles.json" 29]
   ["2 Chronicles" "data/2_Chronicles.json" 36]
   ["Ezra" "data/Ezra.json" 10]
   ["Nehemiah" "data/Nehemiah.json" 13]
   ["Esther" "data/Esther.json" 10]
   ["Job" "data/Job.json" 42]
   ["Psalm" "data/Psalm.json" 150]
   ["Proverbs" "data/Proverbs.json" 31]
   ["Ecclesiastes" "data/Ecclesiastes.json" 12]
   ["Song of Solomon" "data/Song_of_Solomon.json" 8]
   ["Isaiah" "data/Isaiah.json" 66]
   ["Jeremiah" "data/Jeremiah.json" 52]
   ["Lamentations" "data/Lamentations.json" 5]
   ["Ezekiel" "data/Ezekiel.json" 48]
   ["Daniel" "data/Daniel.json" 12]
   ["Hosea" "data/Hosea.json" 14]
   ["Joel" "data/Joel.json" 3]
   ["Amos" "data/Amos.json" 9]
   ["Obadiah" "data/Obadiah.json" 1]
   ["Jonah" "data/Jonah.json" 4]
   ["Micah" "data/Micah.json" 7]
   ["Nahum" "data/Nahum.json" 3]
   ["Habakkuk" "data/Habakkuk.json" 3]
   ["Zephaniah" "data/Zephaniah.json" 3]
   ["Haggai" "data/Haggai.json" 2]
   ["Zechariah" "data/Zechariah.json" 14]
   ["Malachi" "data/Malachi.json" 4]
   ["Matthew" "data/Matthew.json" 28]
   ["Mark" "data/Mark.json" 16]
   ["Luke" "data/Luke.json" 24]
   ["John" "data/John.json" 21]
   ["Acts" "data/Acts.json" 28]
   ["Romans" "data/Romans.json" 16]
   ["1 Corinthians" "data/1_Corinthians.json" 16]
   ["2 Corinthians" "data/2_Corinthians.json" 13]
   ["Galatians" "data/Galatians.json" 6]
   ["Ephesians" "data/Ephesians.json" 6]
   ["Philippians" "data/Philippians.json" 4]
   ["Colossians" "data/Colossians.json" 4]
   ["1 Thessalonians" "data/1_Thessalonians.json" 5]
   ["2 Thessalonians" "data/2_Thessalonians.json" 3]
   ["1 Timothy" "data/1_Timothy.json" 6]
   ["2 Timothy" "data/2_Timothy.json" 4]
   ["Titus" "data/Titus.json" 3]
   ["Philemon" "data/Philemon.json" 1]
   ["Hebrews" "data/Hebrews.json" 13]
   ["James" "data/James.json" 5]

;; ──── Helpers ────

(defn book-index [book-name]
  (first (keep-indexed (fn [i [n _ _]] (when (= n book-name) i)) books-manifest)))

(defn book-by-index [idx]
  (nth books-manifest idx nil))

(defn clean-text [s]
  (-> s
      (clojure.string/replace #"\*[a-z]+" "")
      (clojure.string/replace #"\s+" " ")
      clojure.string/trim))

;; ──── Dexie DB ────

(defonce db
  (let [d (dexie/Dexie. "NASBibleDB")]
    (.stores d (clj->js {:verses "&ref" :highlights "&verseRef" :settings "&keyName"}))
    (.open d)
    d))

;; ──── App State Atom ────

(defonce app-state
  (atom {:db nil
         :book "Genesis"
         :chapter 1
         :verse 0         ;; current verse index within the chapter's verse-items (including headings)
         :verses []       ;; the processed verse/h items for current chapter
         :font-size 18
         :highlights #{}  ;; set of "Book:C:V" strings
         :search-term ""
         :search-results []
         :search-idx -1
         :loading false
         :load-progress 0
         :prefix ""       ;; number prefix buffer
         :prefix-time 0   ;; timestamp for prefix timeout
         :last-g 0        ;; timestamp for gg detection
         :status-msg ""}))

;; ──── Data Loading ────

(defn load-manifest-promise []
  (js/fetch "data/manifest.json"
    #js {:headers #js {"Accept" "application/json"}}))

(defn fetch-book-json [url]
  (js/fetch url #js {:headers #js {"Accept" "application/json"}}))

(defn store-book-chapters [book-name json-data]
  (let [items (js->clj (js/JSON.parse json-data) :keywordize-keys true)
        grouped (group-by :c items)]
    (js/Promise.all
      (for [[ch items] grouped]
        (let [ref (str book-name ":" ch)
              verses (clj->js items)]
          (.put (.-verses db) (clj->js {:ref ref :book book-name :chapter ch :verses verses})))))))

(defn load-book [book-name cb]
  (let [idx (book-index book-name)
        [name file chs] (book-by-index idx)
        chapters (range 1 (inc chs))
        ;; Check which chapters are already cached
        refs (mapv #(str book-name ":" %) chapters)]
    (-> (.bulkGet (.-verses db) (clj->js refs))
        (.then (fn [cached]
                 (let [missing (keep-indexed (fn [i v] (when (nil? v) (nth chapters i))) (js->clj cached))
                       ;; Also check if we've loaded this book before
                       missing-c (if (> (count missing) 0) missing
                                   ;; Still fetch to be safe - some might be partial
                                   [])]
                   (if (empty? missing-c)
                     (do (cb true) (js/Promise.resolve true))
                     ;; Fetch the full JSON and store
                     (-> (fetch-book-json file)
                         (.then #(.text %))
                         (.then (fn [txt] (store-book-chapters book-name txt)))
                         (.then #(cb true))
                         (.catch (fn [e] (js/console.error "Load error:" e) (cb false))))))))
        (.catch (fn [e] (js/console.error "BulkGet error:" e) (cb false))))))

(defn load-chapter-verses [book-name ch cb]
  (let [ref (str book-name ":" ch)]
    (-> (.get (.-verses db) ref)
        (.then (fn [row]
                 (if row
                   (let [verses (js->clj (.-verses row) :keywordize-keys true)]
                     (swap! app-state assoc
                            :book book-name :chapter ch :verses verses :verse 0)
                     (cb verses))
                   ;; Not cached, fetch the book
                   (load-book book-name
                     (fn [ok]
                       (if ok
                         (-> (.get (.-verses db) ref)
                             (.then (fn [row2]
                                      (let [verses (js->clj (.-verses row2) :keywordize-keys true)]
                                        (swap! app-state assoc
                                               :book book-name :chapter ch :verses verses :verse 0)
                                        (cb verses)))))
                         (cb [])))))))
        (.catch (fn [e] (js/console.error "Load chapter error:" e) (cb []))))))

;; ──── Highlights ────

(defn load-highlights [cb]
  (-> (.toArray (.-highlights db))
      (.then (fn [rows]
               (let [hs (into #{} (map #(.-verseRef %) (js->clj rows)))]
                 (swap! app-state assoc :highlights hs)
                 (cb hs))))))

(defn toggle-highlight [verseRef]
  (if (contains? (:highlights @app-state) verseRef)
    (do
      (.delete (.-highlights db) verseRef)
      (swap! app-state update :highlights disj verseRef))
    (do
      (.put (.-highlights db) (clj->js {:verseRef verseRef :color "#fff3a8"}))
      (swap! app-state update :highlights conj verseRef))))

(defn highlighted? [verseRef]
  (contains? (:highlights @app-state) verseRef))

;; ──── Settings ────

(defn load-settings [cb]
  (-> (.get (.-settings db) "fontSize")
      (.then (fn [row]
               (when row
                 (let [fs (.-value row)]
                   (swap! app-state assoc :font-size fs)))
               (cb)))
      (.catch (fn [_] (cb)))))

(defn save-font-size [size]
  (.put (.-settings db) (clj->js {:keyName "fontSize" :value size}))
  (swap! app-state assoc :font-size size))

   ["1 Peter" "data/1_Peter.json" 5]
   ["2 Peter" "data/2_Peter.json" 3]
   ["1 John" "data/1_John.json" 5]
   ["2 John" "data/2_John.json" 1]
   ["3 John" "data/3_John.json" 1]
   ["Jude" "data/Jude.json" 1]
   ["Revelation" "data/Revelation.json" 22]])