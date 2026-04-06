
    const state = {
      dataJa: null,
      dataEn: null,
      dataKa: null,
      dataZh: null,
      klvData: null,
      dicJa: null,
      dicEn: null,
      current: null,
      currentKey: null,
      buttons: [],
      readSet: new Set(),
      refExact: { character: new Map(), glossary: new Map() },
      refLoose: { character: new Map(), glossary: new Map() },
      glossaryPreviewBySlug: new Map(),
      glossaryPreviewByLoose: new Map(),
      characterPreviewBySlug: new Map(),
      characterPreviewByLoose: new Map(),
      readPromptHidden: false,
      readPromptShownFor: null,
      readEnabled: true,
      showGloss: false
    };

    const STORAGE_THEME = "repub_theme_v1";
    const STORAGE_READ = "repub_read_episodes_v1";
    const STORAGE_LANG = "repub_lang_v1";
    const STORAGE_ZH_SCRIPT = "repub_zh_script_v1";
    const STORAGE_READ_PROMPT = "repub_read_prompt_v1";
    const STORAGE_READ_ENABLED = "repub_read_enabled_v1";
    let currentLang = "ja";
    let zhScriptMode = "hant";

    const topPageEl = document.getElementById("topPage");
    const topPageEnEl = document.getElementById("topPageEn");
    const topPageZhEl = document.getElementById("topPageZh");
    const topPageKaEl = document.getElementById("topPageKa");
    const articleWrapEl = document.getElementById("articleWrap");
    const mainEl = document.querySelector("main");
    const themeToggle = document.getElementById("themeToggle");
    const langJa = document.getElementById("langJa");
    const langEn = document.getElementById("langEn");
    const langZh = document.getElementById("langZh");
    const langKa = document.getElementById("langKa");
    const zhScriptToggle = document.getElementById("zhScriptToggle");
    const zhScriptNote = document.getElementById("zhScriptNote");
    const zhTradBlock = document.getElementById("zhTradBlock");
    const zhSimpBlock = document.getElementById("zhSimpBlock");

    const langButtons = [langJa, langEn, langZh, langKa].filter(Boolean);
    const shareEpisodeBtn = document.getElementById("shareEpisode");
    const glossToggleBtn = document.getElementById("glossToggle");
    const treeEl = document.getElementById("tree");
    const siteTitleEl = document.getElementById("siteTitle");
    const siteMetaEl = document.getElementById("siteMeta");
    const navTop = document.getElementById("navTop");
    const navChars = document.getElementById("navChars");
    const navGloss = document.getElementById("navGloss");
    const navAudio = document.getElementById("navAudio");
    const navDiary = document.getElementById("navDiary");
    const sidebarEl = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarContentEl = document.getElementById("sidebarContent");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");

    const shareModal = document.getElementById("shareModal");
    const shareTitle = document.getElementById("shareTitle");
    const shareX = document.getElementById("shareX");
    const shareLine = document.getElementById("shareLine");
    const shareFb = document.getElementById("shareFb");
    const shareCopy = document.getElementById("shareCopy");
    const shareNative = document.getElementById("shareNative");
    const shareClose = document.getElementById("shareClose");
    const readPromptModal = document.getElementById("readPromptModal");
    const readPromptNoMore = document.getElementById("readPromptNoMore");
    const readPromptYes = document.getElementById("readPromptYes");
    const readPromptNo = document.getElementById("readPromptNo");
    const readFeatureToggle = document.getElementById("readFeatureToggle");
    let termPreviewEl = null;

    const shareMap = {
      karabatan: {
        label: "カラバァタン共和国物語",
        path: "./share-karabatan.html",
        text: "カラバァタン共和国物語『200メートル先、転向する兄弟』"
      },
      haropinon: {
        label: "ハーロピノン共和国物語",
        path: "./share-haropinon.html",
        text: "ハーロピノン共和国物語『Boy-Meets-Knife』"
      },
      bookkeeper: {
        label: "ブックキーパー",
        path: "./share-bookkeeper.html",
        text: "ブックキーパー『Like Business, Love 推し』"
      }
    };

    let currentShare = null;
    const GISCUS_CONFIG = {
      repo: "SoshuKo/RePubReader",
      repoId: "R_kgDORr7bUw",
      category: "Announcements",
      categoryId: "DIC_kwDORr7bU84C5BUP",
      mapping: "pathname",
      strict: "0",
      reactionsEnabled: "1",
      emitMetadata: "0",
      inputPosition: "bottom",
      theme: "preferred_color_scheme",
      lang: "ja"
    };


    function setSidebarOpen(open) {
      if (!sidebarEl || !sidebarToggle) return;
      sidebarEl.classList.toggle("open", !!open);
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle("show", !!open);
      const icon = sidebarToggle.querySelector(".hamburger-icon");
      if (icon) icon.textContent = open ? "✕" : "☰";
      sidebarToggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      sidebarToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function openFirstEpisodeByShareKey(key) {
      const data = getActiveData();
      if (!data || !Array.isArray(data.works)) return;
      const work = data.works.find((w) => workShareKey(w.id) === key);
      if (!work) return;
      const section = (work.sections || [])[0];
      const ep = section && Array.isArray(section.episodes) ? section.episodes[0] : null;
      if (!section || !ep) return;
      renderEpisode(work, section, ep);
    }

    function openFirstEpisodeBySectionKey(workKey, sectionKey) {
      const data = getActiveData();
      if (!data || !Array.isArray(data.works)) return;
      const work = data.works.find((w) => workShareKey(w.id) === workKey);
      if (!work) return;
      const sections = Array.isArray(work.sections) ? work.sections : [];

      const key = String(sectionKey || "").trim().toLowerCase();
      const aliasMap = {
        karabatan: {
          "アカウ編": ["アカウ編", "akau arc", "akau"]
        },
        haropinon: {
          "パラジェイのナイフ編": ["パラジェイのナイフ編", "pàlajé's knife arc", "palaje's knife arc", "palaje knife arc", "pàlajé knife arc"],
          "グリュックウイルス編": ["グリュックウイルス編", "glúck virus arc", "gluck virus arc"]
        }
      };

      const requestedAliases = ((aliasMap[workKey] && aliasMap[workKey][sectionKey]) || [sectionKey])
        .map((x) => String(x || "").trim().toLowerCase())
        .filter(Boolean);

      const targetSection = sections.find((s) => {
        const sid = String(s.id || "").trim().toLowerCase();
        const stitle = String(s.title || "").trim().toLowerCase();
        if (requestedAliases.includes(sid) || requestedAliases.includes(stitle)) return true;
        if (!key) return false;
        return sid.includes(key) || stitle.includes(key);
      });

      const section = targetSection || sections[0];
      const ep = section && Array.isArray(section.episodes) ? section.episodes[0] : null;
      if (!section || !ep) return;
      renderEpisode(work, section, ep);
    }

    function mountGiscus() {
      const thread = document.getElementById("giscusThread");
      const notice = document.getElementById("giscusNotice");
      if (!thread || thread.dataset.mounted === "1") return;

      if (
        GISCUS_CONFIG.repoId.startsWith("REPLACE_WITH") ||
        GISCUS_CONFIG.categoryId.startsWith("REPLACE_WITH")
      ) {
        if (notice) {
          notice.textContent = "giscus未設定です。repoId/categoryId を index.html の GISCUS_CONFIG に入れると有効化されます。";
        }
        return;
      }

      const s = document.createElement("script");
      s.src = "https://giscus.app/client.js";
      s.async = true;
      s.crossOrigin = "anonymous";
      s.setAttribute("data-repo", GISCUS_CONFIG.repo);
      s.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
      s.setAttribute("data-category", GISCUS_CONFIG.category);
      s.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
      s.setAttribute("data-mapping", GISCUS_CONFIG.mapping);
      s.setAttribute("data-strict", GISCUS_CONFIG.strict);
      s.setAttribute("data-reactions-enabled", GISCUS_CONFIG.reactionsEnabled);
      s.setAttribute("data-emit-metadata", GISCUS_CONFIG.emitMetadata);
      s.setAttribute("data-input-position", GISCUS_CONFIG.inputPosition);
      s.setAttribute("data-theme", GISCUS_CONFIG.theme);
      s.setAttribute("data-lang", GISCUS_CONFIG.lang);

      thread.appendChild(s);
      thread.dataset.mounted = "1";
      if (notice) notice.textContent = "";
    }

    function esc(text) {
      return String(text ?? "").replace(/[&<>\"]/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"
      }[ch]));
    }

    function loadReadSet() {
      try {
        const raw = localStorage.getItem(STORAGE_READ);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) state.readSet = new Set(arr);
      } catch (_) {}
    }

    function saveReadSet() {
      try {
        localStorage.setItem(STORAGE_READ, JSON.stringify([...state.readSet]));
      } catch (_) {}
    }

    function episodeKey(work, section, ep) {
      const w = String(work?.id || work?.title || "work").trim();
      const s = String(section?.id || section?.title || "section").trim();
      const e = String(ep?.id || ep?.label || ep?.title || "episode").trim();
      return `${w}::${s}::${e}`;
    }

    function updateReadBadge(btn) {
      const key = btn.dataset.epkey;
      btn.classList.toggle("read-done", !!key && state.readSet.has(key));
    }

    function markCurrentEpisodeRead() {
      if (!state.currentKey) return;
      if (state.readSet.has(state.currentKey)) return;
      state.readSet.add(state.currentKey);
      saveReadSet();
      refreshEpisodeButtons();
    }




    function loadReadPromptPref() {
      try {
        state.readPromptHidden = localStorage.getItem(STORAGE_READ_PROMPT) === "1";
      } catch (_) {}
    }

    function saveReadPromptPref(hidden) {
      state.readPromptHidden = !!hidden;
      try {
        localStorage.setItem(STORAGE_READ_PROMPT, hidden ? "1" : "0");
      } catch (_) {}
    }

    function updateEpisodeButtonMarks(btn) {
      updateReadBadge(btn);
    }

    function loadReadEnabledPref() {
      try {
        const raw = localStorage.getItem(STORAGE_READ_ENABLED);
        state.readEnabled = raw === null ? true : raw === "1";
      } catch (_) {
        state.readEnabled = true;
      }
      if (readFeatureToggle) readFeatureToggle.checked = state.readEnabled;
    }

    function saveReadEnabledPref(enabled) {
      state.readEnabled = !!enabled;
      if (readFeatureToggle) readFeatureToggle.checked = state.readEnabled;
      try {
        localStorage.setItem(STORAGE_READ_ENABLED, state.readEnabled ? "1" : "0");
      } catch (_) {}
      if (!state.readEnabled) closeReadPrompt();
    }

    function refreshEpisodeButtons() {
      for (const btn of state.buttons) updateEpisodeButtonMarks(btn);
    }


    function getScrollContainer() {
      const docScroller = document.scrollingElement || document.documentElement;
      const mainScrollable = !!(mainEl && (mainEl.scrollHeight - mainEl.clientHeight > 8));
      return mainScrollable ? mainEl : docScroller;
    }

    function getScrollMetrics() {
      const scroller = getScrollContainer();
      const top = Math.max(0, Math.floor(scroller.scrollTop || window.scrollY || 0));
      const clientHeight = scroller.clientHeight || window.innerHeight || 0;
      const scrollHeight = scroller.scrollHeight || document.documentElement.scrollHeight || 0;
      return { top, clientHeight, scrollHeight };
    }

    function scrollEpisodeTop() {
      const scroller = getScrollContainer();
      if (scroller === mainEl) {
        mainEl.scrollTo({ top: 0, behavior: "auto" });
      }
      window.scrollTo({ top: 0, behavior: "auto" });
      if (mainEl && scroller !== mainEl) mainEl.scrollTop = 0;
    }


    function openReadPrompt() {
      if (!readPromptModal || state.readPromptShownFor === state.currentKey) return;
      state.readPromptShownFor = state.currentKey;
      readPromptNoMore.checked = state.readPromptHidden;
      readPromptModal.classList.add("open");
      readPromptModal.setAttribute("aria-hidden", "false");
    }

    function closeReadPrompt() {
      if (!readPromptModal) return;
      readPromptModal.classList.remove("open");
      readPromptModal.setAttribute("aria-hidden", "true");
    }
    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      if (themeToggle) {
        themeToggle.textContent = theme === "dark" ? "ライトモード" : "ダークモード";
      }
    }

    function initTheme() {
      let theme = localStorage.getItem(STORAGE_THEME);
      if (!theme) {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      applyTheme(theme);
      if (themeToggle) {
        themeToggle.addEventListener("click", () => {
          const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
          applyTheme(next);
          localStorage.setItem(STORAGE_THEME, next);
        });
      }
    }


    function getZhSectionIdFromJa(jaSectionId) {
      const map = {
        "パラジェイ編": "Pàlajé Arc",
        "アカネイ編": "Àkané Arc",
        "アカウ編": "Akau Arc"
      };
      return map[String(jaSectionId || "")] || null;
    }

    function getZhEpisodeIdFromJa(jaEpId) {
      if (jaEpId === "EPT-new") return "T";
      return String(jaEpId || "");
    }

    function findZhEpisodeForJa(work, section, ep) {
      if (!state.dataZh || !Array.isArray(state.dataZh.works)) return null;
      if (String(work && work.id || "") !== "カラバァタン共和国物語") return null;
      const zhSectionId = getZhSectionIdFromJa(section && section.id);
      const zhEpId = getZhEpisodeIdFromJa(ep && ep.id);
      if (!zhSectionId || !zhEpId) return null;
      for (const zw of state.dataZh.works) {
        for (const zs of (zw.sections || [])) {
          if (String(zs.id) !== zhSectionId) continue;
          for (const ze of (zs.episodes || [])) {
            if (String(ze.id) === zhEpId) return { work: zw, section: zs, ep: ze };
          }
        }
      }
      return null;
    }

    function toZhHansText(input) {
      const s = String(input || "");
      const map = {
        "個":"个","還":"还","與":"与","為":"为","這":"这","說":"说","對":"对","將":"将","後":"后","來":"来","時":"时","開":"开","關":"关","國":"国","戰":"战","鬥":"斗","劍":"剑","鮮":"鲜","歷":"历","導":"导","擇":"择","話":"话","學":"学","運":"运","動":"动","陰":"阴","謀":"谋","義":"义","壯":"壮","闊":"阔","織":"织","邊":"边","嚴":"严","雜":"杂","體":"体","轉":"转","變":"变","權":"权","點":"点","實":"实","奪":"夺","復":"复","擊":"击","軍":"军","聯":"联","緊":"紧","傀":"傀","儡":"儡","資":"资","本":"本","終":"终","倖":"幸","隱":"隐","邁":"迈","衰":"衰","爭":"争","續":"续","雖":"虽","當":"当","陰":"阴","謀":"谋","鬥":"斗","爭":"争","圍":"围","繞":"绕","捲":"卷","棄":"弃","壓":"压","協":"协","夥":"伙","過":"过","議":"议","贏":"赢","靜":"静","監":"监","滅":"灭","藥":"药","倫":"伦","夾":"夹","縫":"缝","奮":"奋","瀰":"弥","蔓":"蔓","繼":"继","續":"续","熱":"热","血":"血","讀":"读","從":"从","開":"开","始":"始","閱":"阅","薦":"荐","辭":"辞","場":"场","臺":"台","圖":"图","訊":"讯","註":"注","寫":"写","誌":"志","頁":"页","書":"书","線":"线","號":"号","種":"种","達":"达","濟":"济","兩":"两","會":"会","鄰":"邻","風":"风","極":"极","認":"认","繼":"继","擁":"拥","學":"学","醫":"医","師":"师","新":"新","興":"兴","宗":"宗","教":"教","繫":"系","劇":"剧","幕":"幕","門":"门","戶":"户","應":"应","該":"该","貢":"贡","獻":"献","鐵":"铁","軌":"轨","號":"号","處":"处","點":"点","內":"内","訊":"讯"
      };
      return s.replace(/[\s\S]/g, ch => (map[ch] || ch));
    }

    function toZhHansHtml(html) {
      const src = String(html || "");
      return src.replace(/>([^<]*)</g, (m, t) => `>${toZhHansText(t)}<`);
    }

    function getActiveData() {
      if (currentLang === "en" && state.dataEn) return state.dataEn;
      if (currentLang === "ka" && state.dataKa) return state.dataKa;
      if (currentLang === "zh") return state.dataJa;
      
      return state.dataJa;
    }

    function applyZhScript(mode) {
      zhScriptMode = mode === "hans" ? "hans" : "hant";
      if (zhTradBlock) zhTradBlock.style.display = zhScriptMode === "hant" ? "block" : "none";
      if (zhSimpBlock) zhSimpBlock.style.display = zhScriptMode === "hans" ? "block" : "none";
      document.querySelectorAll('[id$="-zh-t"]').forEach((el) => { el.style.display = zhScriptMode === "hant" ? "block" : "none"; });
      document.querySelectorAll('[id$="-zh-s"]').forEach((el) => { el.style.display = zhScriptMode === "hans" ? "block" : "none"; });
      if (zhScriptToggle) zhScriptToggle.textContent = zhScriptMode === "hant" ? "切換為简体" : "切換為繁體";
      if (zhScriptNote) zhScriptNote.textContent = zhScriptMode === "hant" ? "目前：繁體中文" : "当前：简体中文";
      try { localStorage.setItem(STORAGE_ZH_SCRIPT, zhScriptMode); } catch (_) {}
      const activeData = getActiveData();
      if (activeData) buildTree(activeData);
      if (state.current) renderEpisode(state.current.work, state.current.section, state.current.ep);
    }

    function applyLanguage(lang) {
      currentLang = (lang === "en" || lang === "zh" || lang === "ka") ? lang : "ja";
      document.documentElement.setAttribute("lang", currentLang);
      langButtons.forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.dataset.lang === currentLang ? "true" : "false");
      });

      if (siteTitleEl) {
        siteTitleEl.textContent = currentLang === "en"
          ? "Republica Saga"
          : (currentLang === "zh" ? "共和國物語 Saga" : (currentLang === "ka" ? "Republica Saga (Georgian)" : "『共和国物語』 サーガ"));
      }
      if (siteMetaEl) {
        siteMetaEl.textContent = currentLang === "en"
          ? "Story Reader"
          : (currentLang === "zh" ? "故事閱讀器" : (currentLang === "ka" ? "Georgian Reader" : "物語本編ビューア"));
      }

      if (navTop) {
        navTop.textContent = currentLang === "en" ? "Top / Story" : (currentLang === "zh" ? "首頁・本編" : "トップ・本編");
        navTop.href = "index.html" + (currentLang === "en" ? "?lang=en" : (currentLang === "zh" ? "?lang=zh" : (currentLang === "ka" ? "?lang=ka" : "")));
      }
      if (navChars) {
        navChars.textContent = currentLang === "en" ? "Characters" : (currentLang === "zh" ? "登場人物辭典" : "登場人物辞典");
        navChars.href = currentLang === "en" ? "characters.html?lang=en" : "characters.html";
      }
      if (navGloss) {
        navGloss.textContent = currentLang === "en" ? "Glossary" : (currentLang === "zh" ? "用語辭典" : "用語辞典");
        navGloss.href = currentLang === "en" ? "glossary.html?lang=en" : "glossary.html";
      }
      if (navAudio) {
        navAudio.textContent = currentLang === "en" ? "Audio Commentary" : (currentLang === "zh" ? "音訊評註" : "オーディオコメンタリ");
        navAudio.href = "audiocommentary.html";
      }
      if (navDiary) {
        navDiary.textContent = currentLang === "en" ? "Writing Log" : (currentLang === "zh" ? "寫作日誌" : "執筆録");
        navDiary.href = "diary.html";
      }

      if (currentLang === "zh") applyZhScript(zhScriptMode);

      const activeDic = (currentLang === "en" && state.dicEn) ? state.dicEn : state.dicJa;
      if (glossToggleBtn) {
        const useKlv = false;
        glossToggleBtn.style.display = useKlv ? "inline-block" : "none";
        glossToggleBtn.textContent = state.showGloss ? "グロスを隠す" : "グロスを表示";
      }
      if (activeDic) buildGlossaryPreviewMaps(activeDic);
      const activeData = getActiveData();
      if (activeData) buildTree(activeData);
      const incomingHash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      if (state.current && incomingHash !== "" && incomingHash !== "top") {
        renderEpisode(state.current.work, state.current.section, state.current.ep);
      } else {
        showTop(incomingHash === "" || incomingHash === "top");
      }
    }

    function initSidebarToggle() {
      if (!sidebarEl || !sidebarToggle || !sidebarContentEl) return;

      const mq = window.matchMedia("(max-width: 880px)");
      const sync = () => {
        if (mq.matches) {
          setSidebarOpen(false);
        } else {
          if (sidebarBackdrop) sidebarBackdrop.classList.remove("show");
          sidebarEl.classList.add("open");
          const icon = sidebarToggle.querySelector(".hamburger-icon");
          if (icon) icon.textContent = "☰";
          sidebarToggle.setAttribute("aria-label", "メニュー");
          sidebarToggle.setAttribute("aria-expanded", "true");
        }
      };

      sync();
      if (mq.addEventListener) mq.addEventListener("change", sync);
      else if (mq.addListener) mq.addListener(sync);

      sidebarToggle.addEventListener("click", () => {
        if (!mq.matches) return;
        const open = !sidebarEl.classList.contains("open");
        setSidebarOpen(open);
      });

      if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
      }
    }


    function initFirstGuideRotor() {
      if (!guideRotorStage) return;
      let step = 0;
      let timer = null;
      let downX = null;

      const setRotation = (n) => {
        step = ((n % 4) + 4) % 4;
        guideRotorStage.style.transform = `rotateY(${step * -90}deg)`;
      };
      const rotateStep = (delta) => setRotation(step + delta);

      const stopAuto = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };
      const startAuto = () => {
        stopAuto();
        timer = setInterval(() => {
          if (currentLang !== "ja") return;
          rotateStep(1);
        }, 3400);
      };

      const setTip = (txt) => {
        if (!guideTooltip) return;
        guideTooltip.textContent = txt || "";
        guideTooltip.classList.toggle("show", !!txt);
      };

      const goTarget = (target) => {
        if (!target) return;
        if (target.startsWith("#")) {
          const el = document.querySelector(target);
          if (el) {
            showTop(false);
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          return;
        }
        location.href = target;
      };

      guideRotorStage.querySelectorAll(".guide-face").forEach((card, idx) => {
        const label = card.dataset.label || "";
        card.addEventListener("mouseenter", () => setTip(label));
        card.addEventListener("mouseleave", () => setTip(""));
        card.addEventListener("focus", () => setTip(label));
        card.addEventListener("blur", () => setTip(""));
        card.addEventListener("click", () => {
          stopAuto();
          setRotation(idx);
          goTarget(card.dataset.target || "");
        });
      });

      guideRotorStage.addEventListener("wheel", (e) => {
        e.preventDefault();
        stopAuto();
        rotateStep(e.deltaY > 0 ? 1 : -1);
        startAuto();
      }, { passive: false });

      guideRotorStage.addEventListener("pointerdown", (e) => { downX = e.clientX; });
      guideRotorStage.addEventListener("pointerup", (e) => {
        if (downX == null) return;
        const dx = e.clientX - downX;
        downX = null;
        if (Math.abs(dx) > 16) {
          stopAuto();
          rotateStep(dx > 0 ? -1 : 1);
          startAuto();
        }
      });

      setRotation(0);
      startAuto();
    }

    function initLanguage() {
      const qLang = new URLSearchParams(location.search).get("lang");
      let lang = qLang || localStorage.getItem(STORAGE_LANG) || "ja";
      if (!["ja", "en", "zh", "ka"].includes(lang)) lang = "ja";
      try {
        const savedZh = localStorage.getItem(STORAGE_ZH_SCRIPT);
        if (savedZh === "hans" || savedZh === "hant") zhScriptMode = savedZh;
      } catch (_) {}
      localStorage.setItem(STORAGE_LANG, lang);
      applyLanguage(lang);
      langButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = btn.dataset.lang;
          if (!["ja", "en", "zh", "ka"].includes(next)) return;
          localStorage.setItem(STORAGE_LANG, next);
          applyLanguage(next);
        });
      });
      if (zhScriptToggle) {
        zhScriptToggle.addEventListener("click", () => {
          applyZhScript(zhScriptMode === "hant" ? "hans" : "hant");
        });
      }
    }

    function showTop(updateHash = true) {
      if (window.matchMedia("(max-width: 880px)").matches) setSidebarOpen(false);
      topPageEl.style.display = currentLang === "ja" ? "grid" : "none";
      if (topPageEnEl) topPageEnEl.style.display = currentLang === "en" ? "grid" : "none";
      if (topPageZhEl) topPageZhEl.style.display = currentLang === "zh" ? "grid" : "none";
      if (topPageKaEl) topPageKaEl.style.display = currentLang === "ka" ? "grid" : "none";
      articleWrapEl.style.display = "none";
      for (const btn of state.buttons) btn.classList.remove("active");
      if (updateHash) history.replaceState(null, "", "#top");
    }

    function showEpisode() {
      if (window.matchMedia("(max-width: 880px)").matches) setSidebarOpen(false);
      topPageEl.style.display = "none";
      if (topPageEnEl) topPageEnEl.style.display = "none";
      if (topPageZhEl) topPageZhEl.style.display = "none";
      if (topPageKaEl) topPageKaEl.style.display = "none";
      articleWrapEl.style.display = "block";
    }

    function workShareKey(workId) {
      const idRaw = String(workId || "");
      const id = idRaw.toLowerCase();
      if (idRaw.includes("カラバァタン") || id.includes("kalavatan") || id.includes("kàlavatan")) return "karabatan";
      if (idRaw.includes("ハーロピノン") || id.includes("harl-lopinong") || id.includes("har-lopinong") || id.includes("haropinon")) return "haropinon";
      if (idRaw.includes("ブックキーパー") || id.includes("bookkeeper")) return "bookkeeper";
      return "bookkeeper";
    }

    function openWindow(url) {
      window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
    }

    function currentShareUrl() {
      if (!currentShare) return window.location.href;
      const u = new URL(currentShare.path, window.location.href);
      if (currentShare.epKey) u.searchParams.set("ep", currentShare.epKey);
      return u.href;
    }

    function openShareModalItem(item) {
      currentShare = item;
      shareTitle.textContent = `${item.label} を共有`;
      shareModal.classList.add("open");
      shareModal.setAttribute("aria-hidden", "false");
    }

    function openShareModal(key) {
      const item = shareMap[key];
      if (!item) return;
      openShareModalItem({ ...item });
    }

    function closeShareModal() {
      shareModal.classList.remove("open");
      shareModal.setAttribute("aria-hidden", "true");
      currentShare = null;
    }


    function normalizeRefKey(v) {
      return String(v ?? "").trim();
    }

    function normalizeRefLoose(v) {
      return normalizeRefKey(v)
        .replace(/[\s\u3000・･\-‐‑‒–—―'"`~〜～\[\]{}()（）【】「」『』■□◆◇★☆]/g, "")
        .toLowerCase();
    }

    function buildReferenceMaps(storyData) {
      state.refExact.character = new Map();
      state.refExact.glossary = new Map();
      state.refLoose.character = new Map();
      state.refLoose.glossary = new Map();

      const refs = storyData && storyData.references ? storyData.references : {};
      const chars = Array.isArray(refs.characters) ? refs.characters : [];
      const terms = Array.isArray(refs.glossary) ? refs.glossary : [];

      const pushRef = (kind, name, slug) => {
        const ex = normalizeRefKey(name);
        const lo = normalizeRefLoose(name);
        if (!ex || !slug) return;
        if (!state.refExact[kind].has(ex)) state.refExact[kind].set(ex, slug);
        if (lo && !state.refLoose[kind].has(lo)) state.refLoose[kind].set(lo, slug);
      };

      for (const ref of chars) {
        const slug = ref.slug;
        pushRef("character", ref.canonical, slug);
        for (const a of (ref.aliases || [])) pushRef("character", a, slug);
      }
      for (const ref of terms) {
        const slug = ref.slug;
        pushRef("glossary", ref.canonical, slug);
        for (const a of (ref.aliases || [])) pushRef("glossary", a, slug);
      }
    }

    function resolveRefSlug(kind, ...names) {
      for (const name of names) {
        const ex = normalizeRefKey(name);
        if (!ex) continue;
        const exact = state.refExact[kind].get(ex);
        if (exact) return exact;
      }
      for (const name of names) {
        const lo = normalizeRefLoose(name);
        if (!lo) continue;
        const loose = state.refLoose[kind].get(lo);
        if (loose) return loose;
      }
      return null;
    }

    function rewriteInlineRefs(container) {
      if (!container) return;
      const anchors = container.querySelectorAll("a.char-ref, a.term-ref, a[data-ref-type], a[href*='characters.html#'], a[href*='glossary.html#']");
      anchors.forEach((a) => {
        const type = a.dataset.refType || (a.classList.contains("char-ref") ? "character" : (a.classList.contains("term-ref") ? "glossary" : ""));
        const kind = type === "character" ? "character" : (type === "glossary" ? "glossary" : null);
        if (!kind) return;

        const visibleText = (a.textContent || "").trim();
        const canonical = (a.dataset.canonical || "").trim();
        const hrefHash = (() => {
          const href = a.getAttribute("href") || "";
          const i = href.indexOf("#");
          return i >= 0 ? decodeURIComponent(href.slice(i + 1)) : "";
        })();

        const slug = resolveRefSlug(kind, visibleText, canonical, hrefHash);
        if (!slug) return;

        const base = kind === "character" ? "characters.html" : "glossary.html";
        const dictLangQuery = currentLang === "en" ? "?lang=en" : "";
        a.setAttribute("href", `${base}${dictLangQuery}#${encodeURIComponent(slug)}`);
        a.dataset.previewKind = kind;
        a.dataset.previewSlug = slug;
      });
    }
    function addGlossaryPreview(slug, title, text) {
      const t = String(title || "").trim();
      const body = String(text || "").replace(/\s+/g, " ").trim();
      if (!t || !body) return;
      const item = { title: t, text: body.length > 140 ? `${body.slice(0, 140)}...` : body };
      if (slug) {
        const key = String(slug).trim();
        if (key && !state.glossaryPreviewBySlug.has(key)) state.glossaryPreviewBySlug.set(key, item);
      }
      const loose = normalizeRefLoose(t);
      if (loose && !state.glossaryPreviewByLoose.has(loose)) state.glossaryPreviewByLoose.set(loose, item);
    }

    function addCharacterPreview(slug, title, text) {
      const t = String(title || "").trim();
      const body = String(text || "").replace(/\s+/g, " ").trim();
      if (!t || !body) return;
      const item = { title: t, text: body.length > 140 ? `${body.slice(0, 140)}...` : body };
      if (slug) {
        const key = String(slug).trim();
        if (key && !state.characterPreviewBySlug.has(key)) state.characterPreviewBySlug.set(key, item);
      }
      const loose = normalizeRefLoose(t);
      if (loose && !state.characterPreviewByLoose.has(loose)) state.characterPreviewByLoose.set(loose, item);
    }

    function buildGlossaryPreviewMaps(dic) {
      const K = {
        TERM_LIST: "用語",
        TERM_TITLE: "タイトル",
        KNIFE_TITLE: "ナイフ名（見出し）",
        STANCE_TITLE: "構え名（見出し）",
        BODY: "本文",
        COMMENT: "コメント",
        CHAR_TITLE: "人名（見出し）",
        QUOTE: "台詞"
      };

      state.glossaryPreviewBySlug = new Map();
      state.glossaryPreviewByLoose = new Map();
      state.characterPreviewBySlug = new Map();
      state.characterPreviewByLoose = new Map();
      if (!dic || typeof dic !== "object") return;

      const addGlossaryTerm = (term) => {
        if (!term || typeof term !== "object") return;
        const title = term.title || term.name || term.heading || term.term || term[K.TERM_TITLE] || term[K.KNIFE_TITLE] || term[K.STANCE_TITLE] || "";
        const textBody = term.summary || term.body || term.description || term.comment || term.quote || term[K.BODY] || term[K.COMMENT] || "";
        addGlossaryPreview(term.slug || term.id || title, title, textBody);
      };

      if (Array.isArray(dic.glossary)) {
        for (const category of dic.glossary) {
          if (!category || typeof category !== "object") continue;
          const terms = Array.isArray(category.terms) ? category.terms : (Array.isArray(category[K.TERM_LIST]) ? category[K.TERM_LIST] : []);
          for (const term of terms) addGlossaryTerm(term);
        }
      }
      if (Array.isArray(dic.knives)) for (const k of dic.knives) addGlossaryTerm(k);
      if (Array.isArray(dic.stances)) for (const st of dic.stances) addGlossaryTerm(st);

      const chars = Array.isArray(dic.characters) ? dic.characters : [];
      for (const ch of chars) {
        const title = ch[K.CHAR_TITLE] || ch.title || ch.name || ch.id || "";
        const textBody = ch[K.BODY] || ch[K.COMMENT] || ch[K.QUOTE] || "";
        addCharacterPreview(ch.slug || ch.id || title, title, textBody);
      }
    }

    function ensureTermPreviewEl() {
      if (termPreviewEl) return termPreviewEl;
      termPreviewEl = document.createElement("div");
      termPreviewEl.className = "term-preview";
      termPreviewEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(termPreviewEl);
      return termPreviewEl;
    }

    function getTermPreviewItem(anchor) {
      if (!anchor) return null;
      const href = anchor.getAttribute("href") || "";
      const hrefBase = href.split("#")[0] || "";
      const kind = (anchor.dataset.previewKind || anchor.dataset.refType || (
        anchor.classList.contains("char-ref") ? "character" :
        anchor.classList.contains("term-ref") ? "glossary" :
        hrefBase.includes("characters.html") ? "character" : "glossary"
      ));

      const slug = (anchor.dataset.previewSlug || "").trim();
      if (kind === "character") {
        if (slug && state.characterPreviewBySlug.has(slug)) return state.characterPreviewBySlug.get(slug);
      } else {
        if (slug && state.glossaryPreviewBySlug.has(slug)) return state.glossaryPreviewBySlug.get(slug);
      }

      const hashIndex = href.indexOf("#");
      if (hashIndex >= 0) {
        const byHash = decodeURIComponent(href.slice(hashIndex + 1)).trim();
        if (kind === "character" && byHash && state.characterPreviewBySlug.has(byHash)) return state.characterPreviewBySlug.get(byHash);
        if (kind !== "character" && byHash && state.glossaryPreviewBySlug.has(byHash)) return state.glossaryPreviewBySlug.get(byHash);
      }

      const loose = normalizeRefLoose(anchor.textContent || "");
      if (!loose) return null;
      if (kind === "character") return state.characterPreviewByLoose.get(loose) || null;
      return state.glossaryPreviewByLoose.get(loose) || null;
    }

    function positionTermPreview(e, anchor) {
      if (!termPreviewEl) return;
      const gap = 14;
      let x = 18;
      let y = 18;
      if (e && typeof e.clientX === "number" && typeof e.clientY === "number") {
        x = e.clientX + gap;
        y = e.clientY + gap;
      } else if (anchor) {
        const r = anchor.getBoundingClientRect();
        x = r.left + gap;
        y = r.bottom + gap;
      }
      const maxX = window.innerWidth - termPreviewEl.offsetWidth - 10;
      const maxY = window.innerHeight - termPreviewEl.offsetHeight - 10;
      termPreviewEl.style.left = `${Math.max(8, Math.min(x, maxX))}px`;
      termPreviewEl.style.top = `${Math.max(8, Math.min(y, maxY))}px`;
    }

    function showTermPreview(item, e, anchor) {
      const el = ensureTermPreviewEl();
      el.innerHTML = `<p class="term-preview-title">${esc(item.title)}</p><p class="term-preview-text">${esc(item.text)}</p>`;
      el.classList.add("show");
      el.setAttribute("aria-hidden", "false");
      positionTermPreview(e, anchor);
    }

    function hideTermPreview() {
      if (!termPreviewEl) return;
      termPreviewEl.classList.remove("show");
      termPreviewEl.setAttribute("aria-hidden", "true");
    }

    function bindTermPreviews(container) {
      if (!container) return;
      const targets = container.querySelectorAll("a.term-ref, a.char-ref, a[data-ref-type='glossary'], a[data-ref-type='character'], a[href*='glossary.html#'], a[href*='characters.html#']");
      targets.forEach((a) => {
        if (a.dataset.previewBound === "1") return;
        const item = getTermPreviewItem(a);
        if (!item) return;
        a.dataset.previewBound = "1";
        a.addEventListener("mouseenter", (e) => showTermPreview(item, e, a));
        a.addEventListener("mousemove", (e) => positionTermPreview(e, a));
        a.addEventListener("mouseleave", hideTermPreview);
        a.addEventListener("focus", () => showTermPreview(item, null, a));
        a.addEventListener("blur", hideTermPreview);
      });
    }

    function renderKlvEpisodeOverlay(epKey) {
          const episodes = state.klvData && state.klvData.episodes ? state.klvData.episodes : null;
          if (!episodes || typeof episodes !== "object") return null;
          let ep = episodes[epKey] || null;
          if (!ep) {
            const targetId = String(epKey || "").split("::").pop();
            const keys = Object.keys(episodes);
            const idMatch = keys.find((k) => k.endsWith("::" + targetId));
            if (idMatch) ep = episodes[idMatch];
            if (!ep && keys.length === 1) ep = episodes[keys[0]];
          }
          if (!ep || !Array.isArray(ep.blocks) || ep.blocks.length === 0) return null;
          const show = !!state.showGloss;
          return ep.blocks.map((b) => {
            const rows = Array.isArray(b.gloss_rows) ? b.gloss_rows : [];
            let tr = "";
            for (const r of rows) {
              tr += "<tr><td>" + esc(r.surface || "") + "</td><td>" + esc(r.gloss || "") + "</td><td>" + esc(r.ja || "") + "</td></tr>";
            }
            const cls = show ? "gloss-wrap show" : "gloss-wrap";
            return "<div class=\'klv-line\'><p class=\'klv-original\'>" + esc(b.original || "") + "</p><div class=\'" + cls + "\'><table class=\'gloss-table\'><thead><tr><th>単語</th><th>グロス</th><th>訳</th></tr></thead><tbody>" + tr + "</tbody></table><p class=\'gloss-free\'>" + esc(b.translation || "") + "</p></div></div>";
          }).join("\n");
        }

    function renderEpisode(work, section, ep) {
          let displayWork = work;
          let displaySection = section;
          let displayEp = ep;

          if (currentLang === "zh") {
            const zhHit = findZhEpisodeForJa(work, section, ep);
            if (zhHit) {
              displayWork = zhHit.work;
              displaySection = zhHit.section;
              displayEp = zhHit.ep;
            } else {
              localStorage.setItem(STORAGE_LANG, "ja");
              applyLanguage("ja");
              return;
            }
          }

          state.current = { work, section, ep };
          state.readPromptShownFor = null;
          state.currentKey = episodeKey(work, section, ep);
          showEpisode();

          document.getElementById("epTitle").textContent = displayEp.label || displayEp.id || "無題";
          document.getElementById("epTrail").textContent = `${displayWork.title} / ${displaySection.title}`;
          const epContentEl = document.getElementById("epContent");
          const klvHtml = null;
          let html = klvHtml || (Array.isArray(displayEp.content)
            ? displayEp.content.map(block => block.html || `<p>${esc(block.text || "")}</p>`).join("\n")
            : "<p>本文データがありません。</p>");
          if (currentLang === "zh" && zhScriptMode === "hans") html = toZhHansHtml(html);
          epContentEl.innerHTML = html;
          if (!klvHtml) {
            rewriteInlineRefs(epContentEl);
            bindTermPreviews(epContentEl);
          }
          if (glossToggleBtn) {
            const useKlv = false;
            glossToggleBtn.style.display = useKlv ? "inline-block" : "none";
            glossToggleBtn.textContent = state.showGloss ? "グロスを隠す" : "グロスを表示";
          }

          for (const btn of state.buttons) {
            const active = btn.dataset.epid === ep.id && btn.dataset.sectionid === section.id && btn.dataset.workid === work.id;
            btn.classList.toggle("active", active);
            updateEpisodeButtonMarks(btn);
          }
          location.hash = encodeURIComponent(state.currentKey);
          requestAnimationFrame(() => {
            scrollEpisodeTop();
          });
        }



    function localizeSidebarWorkTitle(title) {
      const t = String(title || "");
      if (currentLang !== "zh") return t;
      const map = {
        "カラバァタン共和国物語": "Kàlavatan Republica",
        "ハーロピノン共和国物語": "Har-Lopinong Republica",
        "ブックキーパー": "Bookkeeper"
      };
      return map[t] || t;
    }


    function normSidebarKey(v) {
      return String(v || "")
        .replace(/[　\s]+/g, "")
        .replace(/[＆&]/g, "&")
        .trim();
    }

    function localizeSidebarSectionTitle(title) {
      const t = String(title || "");
      if (currentLang !== "zh") return t;
      const key = normSidebarKey(t);
      const tradMap = {
        "アカウ編": "Akau篇",
        "パラジェイ編": "Pàlajé篇",
        "パラジェイのナイフ編": "Pàlajé匕首篇",
        "グリュックウイルス編": "Glúck病毒篇",
        "アカネイ編": "Àkané篇",
        "ラデン": "Ládén",
        "ウォール": "Worl",
        "レアリア編": "Realia篇",
        "セナリーナの夜編": "Saint Arena之夜篇",
        "「セナリーナの夜」編": "Saint Arena之夜篇",
        "セントアリーナの夜編": "Saint Arena之夜篇",
        "「SaintArenaの夜」編": "Saint Arena之夜篇",
        "アリー&レト奪還編": "Aliĕ & Leto奪還篇",
        "アリー＆レト奪還編": "Aliĕ & Leto奪還篇",
        "ブックキーパー": "Bookkeeper"
      };
      const simpMap = {
        "アカウ編": "Akau篇",
        "パラジェイ編": "Pàlajé篇",
        "パラジェイのナイフ編": "Pàlajé匕首篇",
        "グリュックウイルス編": "Glúck病毒篇",
        "アカネイ編": "Àkané篇",
        "ラデン": "Ládén",
        "ウォール": "Worl",
        "レアリア編": "Realia篇",
        "セナリーナの夜編": "Saint Arena之夜篇",
        "「セナリーナの夜」編": "Saint Arena之夜篇",
        "セントアリーナの夜編": "Saint Arena之夜篇",
        "「SaintArenaの夜」編": "Saint Arena之夜篇",
        "アリー&レト奪還編": "Aliĕ & Leto夺还篇",
        "アリー＆レト奪還編": "Aliĕ & Leto夺还篇",
        "ブックキーパー": "Bookkeeper"
      };
      const map = zhScriptMode === "hans" ? simpMap : tradMap;
      return map[key] || map[t] || t;
    }

    function localizeSidebarEpisodeLabel(label) {
      const t = String(label || "");
      if (currentLang !== "zh") return t;
      const key = normSidebarKey(t);
      const tradMap = {
        "EPL(ラデン)": "EPL(Ládén)",
        "EPL(ラデン旧版)": "EPL(Ládén, 舊版)",
        "EPW(ウォール)": "EPW(Worl)",
        "AliĕとLeto": "Aliĕ 與 Leto",
        "アリー&レト奪還編": "Aliĕ & Leto奪還篇",
        "アリー＆レト奪還編": "Aliĕ & Leto奪還篇",
        "Realia": "Realia",
        "レアリア編": "Realia篇",
        "SaintArenaの夜編": "Saint Arena之夜篇",
        "セナリーナの夜編": "Saint Arena之夜篇",
        "「セナリーナの夜」編": "Saint Arena之夜篇",
        "ブックキーパー": "Bookkeeper"
      };
      const simpMap = {
        "EPL(ラデン)": "EPL(Ládén)",
        "EPL(ラデン旧版)": "EPL(Ládén, 旧版)",
        "EPW(ウォール)": "EPW(Worl)",
        "AliĕとLeto": "Aliĕ 与 Leto",
        "アリー&レト奪還編": "Aliĕ & Leto夺还篇",
        "アリー＆レト奪還編": "Aliĕ & Leto夺还篇",
        "Realia": "Realia",
        "レアリア編": "Realia篇",
        "SaintArenaの夜編": "Saint Arena之夜篇",
        "セナリーナの夜編": "Saint Arena之夜篇",
        "「セナリーナの夜」編": "Saint Arena之夜篇",
        "ブックキーパー": "Bookkeeper"
      };
      const map = zhScriptMode === "hans" ? simpMap : tradMap;
      return map[key] || map[t] || t;
    }

    function buildTree(data) {
      const root = treeEl;
      root.innerHTML = "";
      state.buttons = [];

      if (!Array.isArray(data.works) || data.works.length === 0) {
        root.innerHTML = '<div class="empty">作品データがありません。</div>';
        return;
      }

      for (const work of data.works) {
        const d = document.createElement("details");
        d.open = true;
        const s = document.createElement("summary");
        s.textContent = localizeSidebarWorkTitle(work.title || work.id || "無題作品");
        d.appendChild(s);

        for (const section of (work.sections || [])) {
          const box = document.createElement("div");
          box.className = "section";
          const h = document.createElement("p");
          h.className = "section-title";
          h.textContent = localizeSidebarSectionTitle(section.title || section.id || "無題セクション");
          box.appendChild(h);

          for (const ep of (section.episodes || [])) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "episode-btn";
            btn.textContent = localizeSidebarEpisodeLabel(ep.label || ep.id || "EP");
            btn.dataset.workid = work.id;
            btn.dataset.sectionid = section.id;
            btn.dataset.epid = ep.id;
            btn.dataset.epkey = episodeKey(work, section, ep);
            btn.addEventListener("click", (ev) => {
              const rect = btn.getBoundingClientRect();
              const x = ev.clientX - rect.left;
              const onReadMark = x >= (rect.width - 24);
              if (onReadMark && state.readSet.has(btn.dataset.epkey)) {
                if (confirm("既読を取り消しますか？")) {
                  state.readSet.delete(btn.dataset.epkey);
                  saveReadSet();
                  refreshEpisodeButtons();
                }
                return;
              }
              renderEpisode(work, section, ep);
            });
            updateEpisodeButtonMarks(btn);
            box.appendChild(btn);
            state.buttons.push(btn);
          }
          d.appendChild(box);
        }
        root.appendChild(d);
      }

      const fromHash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      if (!fromHash || fromHash === "top") {
        const incomingHash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      if (state.current && incomingHash !== "" && incomingHash !== "top") {
        renderEpisode(state.current.work, state.current.section, state.current.ep);
      } else {
        showTop(incomingHash === "" || incomingHash === "top");
      }
        return;
      }

      let [wid, sid, eid] = fromHash.split("::");
      if (currentLang === "zh") {
        const widMap = {
          "The Kàlavétan Republic Story": "カラバァタン共和国物語",
          "The Kàlavé tan Republic Story": "カラバァタン共和国物語",
          "The Kàlavétan Republica Story": "カラバァタン共和国物語"
        };
        const sidMap = {
          "Pàlajé Arc": "パラジェイ編",
          "Àkané Arc": "アカネイ編",
          "Akau Arc": "アカウ編"
        };
        const eidMap = {
          "T": "EPT-new"
        };
        if (widMap[wid]) wid = widMap[wid];
        if (sidMap[sid]) sid = sidMap[sid];
        if (eidMap[eid]) eid = eidMap[eid];
      }
      for (const work of data.works) {
        if (work.id !== wid) continue;
        for (const section of (work.sections || [])) {
          if (section.id !== sid) continue;
          for (const ep of (section.episodes || [])) {
            if (ep.id === eid) {
              renderEpisode(work, section, ep);
              return;
            }
          }
        }
      }

      const incomingHash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      if (state.current && incomingHash !== "" && incomingHash !== "top") {
        renderEpisode(state.current.work, state.current.section, state.current.ep);
      } else {
        showTop(incomingHash === "" || incomingHash === "top");
      }
    }

    function handleMainScroll() {
      if (articleWrapEl.style.display !== "block") return;
      if (!state.readEnabled) return;
      const { top, clientHeight, scrollHeight } = getScrollMetrics();
      const nearBottom = top + clientHeight >= scrollHeight - 8;
      if (!nearBottom) return;
      if (state.readSet.has(state.currentKey)) return;
      if (state.readPromptHidden) {
        markCurrentEpisodeRead();
      } else {
        openReadPrompt();
      }
    }

    async function boot() {
      try {
        const [jaRes, enRes, kaRes, zhRes, dicJaRes, dicEnRes] = await Promise.all([
                  fetch("./data/物語本編.json", { cache: "no-store" }),
                  fetch("./data/story_en.json", { cache: "no-store" }),
                  fetch("./data/story_ka.json", { cache: "no-store" }),
                  fetch("./data/物語本編_繁體中文.json", { cache: "no-store" }),
                  
                  fetch("./data/rpdic.json", { cache: "no-store" }),
                  fetch("./data/rpdic_en.json", { cache: "no-store" })
                ]);
        if (!jaRes.ok) throw new Error(`HTTP ${jaRes.status}`);
        state.dataJa = await jaRes.json();
        buildReferenceMaps(state.dataJa);

        if (enRes.ok) state.dataEn = await enRes.json();
        if (kaRes.ok) state.dataKa = await kaRes.json();
        if (zhRes.ok) state.dataZh = await zhRes.json();
        

        if (dicJaRes.ok) state.dicJa = await dicJaRes.json();
        if (dicEnRes.ok) state.dicEn = await dicEnRes.json();
        const activeDic = (currentLang === "en" && state.dicEn) ? state.dicEn : state.dicJa;
        if (activeDic) buildGlossaryPreviewMaps(activeDic);

        const activeData = getActiveData();
        if (activeData) buildTree(activeData);
      } catch (e) {
        treeEl.innerHTML = `<div class="empty">Load failed: ${esc(e.message)}</div>`;
      }
    }

    document.getElementById("backTop").addEventListener("click", showTop);
    mainEl.addEventListener("scroll", handleMainScroll, { passive: true });
    window.addEventListener("scroll", handleMainScroll, { passive: true });

    window.addEventListener("hashchange", () => {
      const h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      if (h === "top") showTop();
    });

    document.querySelectorAll(".share-link[data-share]").forEach((btn) => {
      btn.addEventListener("click", () => openShareModal(btn.dataset.share));
    });
    if (readPromptYes) {
      readPromptYes.addEventListener("click", () => {
        saveReadPromptPref(!!readPromptNoMore.checked);
        markCurrentEpisodeRead();
        closeReadPrompt();
      });
    }
    if (readPromptNo) {
      readPromptNo.addEventListener("click", () => {
        saveReadPromptPref(!!readPromptNoMore.checked);
        closeReadPrompt();
      });
    }
    if (readPromptModal) {
      readPromptModal.addEventListener("click", (e) => { if (e.target === readPromptModal) closeReadPrompt(); });
    }

    if (glossToggleBtn) {
      glossToggleBtn.addEventListener("click", () => {
        state.showGloss = !state.showGloss;
        glossToggleBtn.textContent = state.showGloss ? "グロスを隠す" : "グロスを表示";
        if (state.current) renderEpisode(state.current.work, state.current.section, state.current.ep);
      });
    }

    shareEpisodeBtn.addEventListener("click", () => {
      if (!state.current) return;
      const key = workShareKey(state.current.work.id);
      const base = shareMap[key];
      const label = `${state.current.work.title} ${state.current.ep.label || state.current.ep.id}`;
      openShareModalItem({
        label,
        path: base.path,
        text: `${label} を共有`,
        epKey: state.currentKey
      });
    });

    shareX.addEventListener("click", () => {
      if (!currentShare) return;
      const u = encodeURIComponent(currentShareUrl());
      const tt = encodeURIComponent(currentShare.text || currentShare.label || "");
      openWindow(`https://twitter.com/intent/tweet?url=${u}&text=${tt}`);
    });

    shareLine.addEventListener("click", () => {
      if (!currentShare) return;
      const u = encodeURIComponent(currentShareUrl());
      openWindow(`https://social-plugins.line.me/lineit/share?url=${u}`);
    });

    shareFb.addEventListener("click", () => {
      if (!currentShare) return;
      const u = encodeURIComponent(currentShareUrl());
      openWindow(`https://www.facebook.com/sharer/sharer.php?u=${u}`);
    });

    shareCopy.addEventListener("click", async () => {
      if (!currentShare) return;
      try {
        await navigator.clipboard.writeText(currentShareUrl());
        shareCopy.textContent = "コピーしました";
        setTimeout(() => { shareCopy.textContent = "リンクをコピー"; }, 1200);
      } catch (_) {
        alert("コピーに失敗しました。");
      }
    });

    shareNative.addEventListener("click", async () => {
      if (!currentShare) return;
      if (!navigator.share) {
        alert("この端末ではネイティブ共有が使えません。");
        return;
      }
      try {
        await navigator.share({ title: currentShare.label, text: currentShare.text, url: currentShareUrl() });
      } catch (_) {}
    });

    document.querySelectorAll(".ep1-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.workKey;
        if (key) openFirstEpisodeByShareKey(key);
      });
    });

    document.querySelectorAll(".rec-open").forEach((btn) => {
      btn.addEventListener("click", () => {
        const workKey = btn.dataset.workKey;
        const sectionKey = btn.dataset.sectionKey;
        if (workKey && sectionKey) openFirstEpisodeBySectionKey(workKey, sectionKey);
      });
    });

    shareClose.addEventListener("click", closeShareModal);
    shareModal.addEventListener("click", (e) => { if (e.target === shareModal) closeShareModal(); });

    loadReadSet();
    loadReadPromptPref();
    loadReadEnabledPref();
    if (readFeatureToggle) {
      readFeatureToggle.addEventListener("change", () => {
        saveReadEnabledPref(!!readFeatureToggle.checked);
      });
    }
    initTheme();
    initSidebarToggle();
    initLanguage();
    initFirstGuideRotor();
    mountGiscus();
    boot();
  