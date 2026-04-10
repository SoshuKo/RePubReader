window.RePuniS_CONFIG = {
  assetBase: "./image",
  farBgFiles: ["朝.jpg", "昼.jpg", "夕方.jpg", "夜.jpg"],
  dayCycleMs: 15 * 60 * 1000,
  dayFadeMs: 1800,

  speechJsonCandidates: ["./RePuniS.json"],
  autoSpeechIntervalMs: 30 * 1000,
  autoSpeechChance: 1 / 5,
  speechBubbleMs: 3200,
  contactSpeechIntervalMs: 30 * 1000,
  contactChatChance: 1 / 3,
  contactDialogueChance: 1 / 2,
  contactPairCooldownMs: 15 * 60 * 1000,
  dialogueLineIntervalMs: 900,

  autoBehaviorIntervalMs: 30 * 1000,
  autoPerceptionRange: 520,
  autoImproveEps: 6,
  autoRollNoImproveLimit: 2,

  itemDespawnIdleMs: 2 * 60 * 1000,
  itemSweepIntervalMs: 1000,

  eatEffectMs: 2200,
  foodItemNames: ["チャハン", "サシィク", "タピオカ"],

  charBaseHeight: 69,
  itemBaseHeightRate: 0.75,
  npcLimit: 2,
  itemLimit: 2,
  knifeReferenceName: "ガナリのナイフ",

  physics: {
    gravity: 230,
    drag: 0.995,
    bounce: 0.35,
    maxFall: 1200
  },

  edgeIconMargin: 70,

  stages: [
    { bg: "アーケイ.png", mask: "判定1.png" },
    { bg: "イラー.png", mask: "判定2.png" },
    { bg: "シュメケルペ.png", mask: "判定3.png" },
    { bg: "ヘリエン.png", mask: "判定3.png" }
  ],

  characterGroups: [
    { title: "タネイ政権", names: ["アカウ", "カレイ", "タネイ", "モノ"] },
    { title: "西アルトス研究会", names: ["アリー", "レト", "ファタ", "ミナツ", "クラ", "ハル"] },
    { title: "サウソス", names: ["サテラ", "シユウ", "シナン", "モン"] },
    { title: "VUISAL", names: ["チエル", "メウ", "ニプロ", "ロイド", "レイマー", "ヴィオン"] },
    { title: "ZC", names: ["チサ", "ジョーチョ"] },
    { title: "五天", names: ["アルカ", "キルロード", "キュビ", "コト", "アーシャ"] }
  ],

  characterFiles: {
    "アカウ": "アカウ.png", "カレイ": "カレイ.png", "タネイ": "タネイ.png", "モノ": "モノ.png",
    "アリー": "アリー.png", "レト": "レト.png", "ファタ": "ファタ.png", "ミナツ": "ミナツ.png", "クラ": "クラ.png", "ハル": "ハル.png",
    "サテラ": "サテラ.png", "シユウ": "シユウ.png", "シナン": "シナン.png", "モン": "モン.png",
    "チエル": "チエル.png", "メウ": "メウ.png", "ニプロ": "ニプロ.png", "ロイド": "ロイド.png", "レイマー": "レイマー.png", "ヴィオン": "ヴィオン.png",
    "チサ": "チサ.png", "ジョーチョ": "ジョーチョ.png",
    "アルカ": "アルカ.png", "キルロード": "キルロード.png", "キュビ": "キュビ.png", "コト": "コト.png", "アーシャ": "アーシャ.png"
  },

  itemFiles: {
    "狐色のナイフ": "狐色のナイフ.png", "漆黒のナイフ": "漆黒のナイフ.PNG", "真紅のナイフ": "真紅のナイフ.png", "純白のナイフ": "純白のナイフ.png",
    "アヤのナイフ": "アヤのナイフ.png", "コトのナイフ": "コトのナイフ.PNG", "サテラのナイフ": "サテラのナイフ.PNG", "ガナリのナイフ": "ガナリのナイフ.png",
    "チャハン": "チャハン.png", "サシィク": "サシィク.png", "タピオカ": "タピオカ.png", "ギター": "ギター.png", "ぬいぐるみ": "ぬいぐるみ.png"
  },

  initialSelectedCharacter: "アカウ",
  initialSelectedItem: "狐色のナイフ"
};
