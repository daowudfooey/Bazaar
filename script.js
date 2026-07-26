"use strict";

// =========================================================
// CONSTANTS
// =========================================================

const STARTING_SILVER = 12;

const CONDITIONS = [
  "For Parts",
  "Used",
  "Good",
  "Like New",
];

const PRICE_BY_CONDITION = {
  "For Parts": 1,
  "Used": 1,
  "Good": 3,
  "Like New": 3,
};

const ROLY_POLY_ITEMS = new Set([
  "Wraps",
  "Fulu",
  "Fistguard",
  "Grips",
  "Knuckles",
]);

const DEJA_VU_VUJA_ITEMS = new Set([
  "Statue",
  "Seal",
  "Bowl",
  "Jar",
]);

const STALLS = [
  {
    name: "🧧 Fulu Cloth Shop (d12)",
    size: 12,
    items: [
      "Wraps",
      "Fulu",
    ],
  },
  {
    name: "🐫 Hui Caravan (d6)",
    size: 6,
    items: [
      "Coin",
      "Statue",
      "Seal",
      "Bowl",
      "Jar",
    ],
  },
  {
    name: "🏺 Dynasty 货 Wares (d8)",
    size: 8,
    items: [
      "Coin",
      "Fulu",
      "Statue",
      "Gloves",
      "Bowl",
      "Jar",
    ],
  },
  {
    name: "🎭 Arte Della Confidenza (d6)",
    size: 6,
    items: [
      "Coin",
      "Wraps",
      "Fulu",
      "Statue",
    ],
  },
  {
    name: "🧱 Dynasty 革 Leather (d6)",
    size: 6,
    items: [
      "Fistguard",
      "Grips",
      "Gloves",
    ],
  },
  {
    name: "🏮 Dynasty 金 Metal (d4)",
    size: 4,
    items: [
      "Knuckles",
      "Bracers",
      "Plates",
    ],
  },
];


// =========================================================
// GAME STATE
// =========================================================

const screen = document.querySelector("#screen");

let silver = STARTING_SILVER;
let market = [];
let inventory = [];

let currentView = "bazaar";

let menuCursor = 0;
let shopCursor = 0;
let identifierCursor = 0;

let activeShopIndex = 0;
let pendingItemIndex = null;

let messageReturnView = "bazaar";


// =========================================================
// RANDOM HELPERS
// =========================================================

function shuffled(array) {
  const copy = [...array];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [
      copy[index],
      copy[randomIndex],
    ] = [
      copy[randomIndex],
      copy[index],
    ];
  }

  return copy;
}


function randomChoice(array) {
  const randomIndex = Math.floor(
    Math.random() * array.length
  );

  return array[randomIndex];
}


// =========================================================
// BUILD TIER POOL
// =========================================================

function buildTierPool() {
  const tiers = [
    ...Array(25).fill("junk"),
    ...Array(11).fill("standard"),
    ...Array(4).fill("exceptional"),
    ...Array(2).fill("rare"),
  ];

  return shuffled(tiers);
}


// =========================================================
// BUILD MARKET
// =========================================================

function buildMarket() {
  const tiers = buildTierPool();

  let tierIndex = 0;

  return STALLS.map((stall) => {
    const items = [];

    for (
      let itemIndex = 0;
      itemIndex < stall.size;
      itemIndex += 1
    ) {
      const condition = randomChoice(CONDITIONS);
      const originalName = randomChoice(stall.items);

      const item = {
        originalName,
        condition,
        price: PRICE_BY_CONDITION[condition],
        tier: tiers[tierIndex],
        identified: false,
        prizeName: null,
        signature: null,
        stats: [],
      };

      items.push(item);
      tierIndex += 1;
    }

    return {
      name: stall.name,
      items,
    };
  });
}


// =========================================================
// TEXT HELPERS
// =========================================================

function titleCase(value) {
  return (
    value.charAt(0).toUpperCase()
    + value.slice(1)
  );
}


function getItemDisplayName(item) {
  if (
    item.identified
    && item.prizeName
  ) {
    return item.prizeName;
  }

  return (
    `${item.condition} `
    + `${item.originalName}`
  );
}


// =========================================================
// ASSIGN IDENTIFIER PRIZE
// =========================================================

function assignIdentifierPrize(item) {
  if (item.tier !== "rare") {
    return;
  }

  if (
    ROLY_POLY_ITEMS.has(
      item.originalName
    )
  ) {
    item.prizeName = "🏆🥊 Roly Poly";

    item.signature = (
      "θθ圆滚滚27189°"
    );

    item.stats = [
      (
        "Unarmed Strike upgraded: "
        + "1d4 → 2d4"
      ),
      (
        "If target Knocked Prone: "
        + "gain a bonus Unarmed Strike "
        + "against an enemy within 5 ft"
      ),
    ];
  }

  else if (
    DEJA_VU_VUJA_ITEMS.has(
      item.originalName
    )
  ) {
    item.prizeName = (
      "🧞 Deja Vu Vuja De "
      + item.originalName
    );

    item.stats = [
      "Djinn Jutsu: Main Action",
      "Party Buff",
      (
        "Enemies within a 60 ft radius "
        + "are stunned for 1 turn"
      ),
    ];
  }

  else if (
    item.originalName === "Coin"
  ) {
    item.prizeName = (
      "🐉 Lucky Dragon Coin"
    );

    item.stats = [
      "+1 to all saving throws",
      "+1 to all checks",
    ];
  }
}


// =========================================================
// SCREEN OUTPUT
// =========================================================

function setScreen(lines) {
  screen.textContent = (
    `${lines.join("\n")}\n\n>`
  );
}


// =========================================================
// DISPLAY MESSAGE
// =========================================================

function showMessage(
  heading,
  bodyLines,
  returnView
) {
  messageReturnView = returnView;
  currentView = "message";

  setScreen([
    heading,
    "",
    ...bodyLines,
    "",
    "Press Enter to continue...",
  ]);
}


// =========================================================
// RESET MARKET DAY
// =========================================================

function resetMarketDay() {
  silver = STARTING_SILVER;

  inventory = [];
  market = buildMarket();

  currentView = "bazaar";

  menuCursor = 0;
  shopCursor = 0;
  identifierCursor = 0;

  activeShopIndex = 0;
  pendingItemIndex = null;

  render();
}


// =========================================================
// DISPLAY BAZAAR MENU
// =========================================================

function renderBazaar() {
  const lines = [
    "🏮 押店 BAZAAR — MARKET DAY",
    "",
    "Choose a destination:",
    "",
  ];

  market.forEach(
    (shop, shopIndex) => {
      const marker = (
        shopIndex === menuCursor
          ? "▶"
          : " "
      );

      lines.push(
        `${marker} ${shop.name} `
        + `[${shop.items.length} items]`
      );
    }
  );

  const identifierIndex = market.length;

  const identifierMarker = (
    menuCursor === identifierIndex
      ? "▶"
      : " "
  );

  lines.push("");

  lines.push(
    `${identifierMarker} `
    + `🔍 Identifier `
    + `[${inventory.length} items]`
  );

  lines.push("");

  lines.push(
    `🪙 Allowance: ${silver} sp`
  );

  lines.push("");

  lines.push(
    "W/S: Move   "
    + "Enter: Open   "
    + "Q: Leave Bazaar"
  );

  setScreen(lines);
}


// =========================================================
// DISPLAY SHOP ITEMS
// =========================================================

function renderShop() {
  const shop = market[activeShopIndex];

  const lines = [
    shop.name,
    "",
    `🪙 Allowance: ${silver} sp`,
    "",
  ];

  if (shop.items.length === 0) {
    lines.push(
      "This shop is sold out."
    );

    lines.push("");

    lines.push(
      "B: Back   "
      + "Q: Leave Bazaar"
    );

    setScreen(lines);
    return;
  }

  shop.items.forEach(
    (item, itemIndex) => {
      const marker = (
        itemIndex === shopCursor
          ? "▶"
          : " "
      );

      lines.push(
        `${marker} ${itemIndex + 1}. `
        + `${item.condition} `
        + `${item.originalName} — `
        + `${item.price} sp`
      );
    }
  );

  lines.push("");

  lines.push(
    "W/S: Move   "
    + "Enter: Purchase   "
    + "B: Back   "
    + "Q: Leave Bazaar"
  );

  setScreen(lines);
}


// =========================================================
// DISPLAY PURCHASE PROMPT
// =========================================================

function renderPurchase() {
  const shop = market[activeShopIndex];
  const item = shop.items[pendingItemIndex];

  setScreen([
    "🪙 PURCHASE ITEM",
    "",
    `🪙 Allowance: ${silver} sp`,
    "",
    `Shop:      ${shop.name}`,
    `Item:      ${item.originalName}`,
    `Condition: ${item.condition}`,
    `Price:     ${item.price} sp`,
    "",
    "Purchase this item? Y/N",
  ]);
}


// =========================================================
// DISPLAY IDENTIFIER
// =========================================================

function renderIdentifier() {
  const lines = [
    "🔍 IDENTIFIER",
    "",
    `🪙 Allowance: ${silver} sp`,
    "",
    "\"One silver per item.\"",
    "",
  ];

  if (inventory.length === 0) {
    lines.push(
      "You have no items to identify."
    );

    lines.push("");

    lines.push(
      "B: Back   "
      + "Q: Leave Bazaar"
    );

    setScreen(lines);
    return;
  }

  inventory.forEach(
    (item, itemIndex) => {
      const marker = (
        itemIndex === identifierCursor
          ? "▶"
          : " "
      );

      let tierText = "";

      if (item.identified) {
        tierText = (
          ` — ${titleCase(item.tier)}`
        );
      }

      lines.push(
        `${marker} ${itemIndex + 1}. `
        + `${getItemDisplayName(item)}`
        + `${tierText}`
      );
    }
  );

  lines.push("");

  lines.push(
    "W/S: Move   "
    + "Enter: Select   "
    + "B: Back   "
    + "Q: Leave Bazaar"
  );

  setScreen(lines);
}


// =========================================================
// DISPLAY IDENTIFY PROMPT
// =========================================================

function renderIdentifyPrompt() {
  const item = inventory[pendingItemIndex];

  setScreen([
    "🔍 IDENTIFY ITEM",
    "",
    `🪙 Allowance: ${silver} sp`,
    "",
    (
      `Item: ${item.condition} `
      + `${item.originalName}`
    ),
    "Fee:  1 sp",
    "",
    "Pay the Identifier? Y/N",
  ]);
}


// =========================================================
// DISPLAY IDENTIFIED ITEM
// =========================================================

function renderIdentifiedItem(
  item,
  heading
) {
  const lines = [
    heading,
    "",
    `Item: ${getItemDisplayName(item)}`,
  ];

  if (item.signature) {
    lines.push(
      "Identifier's Mark: "
      + item.signature
    );
  }

  lines.push(
    `Tier: ${titleCase(item.tier)}`
  );

  if (item.stats.length > 0) {
    lines.push("");
    lines.push("Stats:");

    item.stats.forEach((stat) => {
      lines.push(`→ ${stat}`);
    });
  }

  lines.push("");
  lines.push(
    "Press Enter to continue..."
  );

  setScreen(lines);
}


// =========================================================
// DISPLAY MARKET DAY SUMMARY
// =========================================================

function renderSummary() {
  const spentSilver = (
    STARTING_SILVER - silver
  );

  const identifiedItems = (
    inventory.filter(
      (item) => item.identified
    ).length
  );

  const lines = [
    "🌙 MARKET DAY COMPLETE",
    "",
    (
      "Silver spent:       "
      + `${spentSilver} sp`
    ),
    (
      "Silver remaining:   "
      + `${silver} sp`
    ),
    (
      "Items purchased:    "
      + inventory.length
    ),
    (
      "Items identified:   "
      + identifiedItems
    ),
  ];

  if (inventory.length > 0) {
    lines.push("");
    lines.push("Inventory:");

    inventory.forEach((item) => {
      lines.push(
        `→ ${getItemDisplayName(item)}`
      );
    });
  }

  lines.push("");

  lines.push(
    "R: Begin New Market Day"
  );

  setScreen(lines);
}


// =========================================================
// MAIN RENDER FUNCTION
// =========================================================

function render() {
  if (currentView === "bazaar") {
    renderBazaar();
  }

  else if (currentView === "shop") {
    renderShop();
  }

  else if (currentView === "purchase") {
    renderPurchase();
  }

  else if (
    currentView === "identifier"
  ) {
    renderIdentifier();
  }

  else if (
    currentView === "identifyPrompt"
  ) {
    renderIdentifyPrompt();
  }

  else if (
    currentView === "summary"
  ) {
    renderSummary();
  }
}


// =========================================================
// LEAVE BAZAAR
// =========================================================

function leaveBazaar() {
  currentView = "summary";
  render();
}


// =========================================================
// BAZAAR INPUT
// =========================================================

function handleBazaarInput(key) {
  const menuSize = market.length + 1;

  if (
    key === "w"
    || key === "arrowup"
  ) {
    menuCursor = (
      menuCursor - 1 + menuSize
    ) % menuSize;

    render();
  }

  else if (
    key === "s"
    || key === "arrowdown"
  ) {
    menuCursor = (
      menuCursor + 1
    ) % menuSize;

    render();
  }

  else if (key === "enter") {
    if (menuCursor < market.length) {
      activeShopIndex = menuCursor;
      shopCursor = 0;
      currentView = "shop";
    }

    else {
      identifierCursor = 0;
      currentView = "identifier";
    }

    render();
  }

  else if (key === "q") {
    leaveBazaar();
  }
}


// =========================================================
// SHOP INPUT
// =========================================================

function handleShopInput(key) {
  const shop = market[activeShopIndex];

  if (
    key === "b"
    || key === "escape"
  ) {
    currentView = "bazaar";
    render();
  }

  else if (key === "q") {
    leaveBazaar();
  }

  else if (
    shop.items.length === 0
  ) {
    return;
  }

  else if (
    key === "w"
    || key === "arrowup"
  ) {
    shopCursor = (
      shopCursor
      - 1
      + shop.items.length
    ) % shop.items.length;

    render();
  }

  else if (
    key === "s"
    || key === "arrowdown"
  ) {
    shopCursor = (
      shopCursor + 1
    ) % shop.items.length;

    render();
  }

  else if (key === "enter") {
    const item = (
      shop.items[shopCursor]
    );

    if (silver < item.price) {
      showMessage(
        "❌ NOT ENOUGH SILVER",
        [
          (
            `The item costs `
            + `${item.price} sp.`
          ),
          (
            `You have `
            + `${silver} sp remaining.`
          ),
        ],
        "shop"
      );

      return;
    }

    pendingItemIndex = shopCursor;
    currentView = "purchase";

    render();
  }
}


// =========================================================
// PURCHASE INPUT
// =========================================================

function handlePurchaseInput(key) {
  if (
    key === "n"
    || key === "escape"
    || key === "b"
  ) {
    currentView = "shop";
    render();
    return;
  }

  if (
    key !== "y"
    && key !== "enter"
  ) {
    return;
  }

  const shop = market[activeShopIndex];

  const purchasedItem = (
    shop.items.splice(
      pendingItemIndex,
      1
    )[0]
  );

  silver -= purchasedItem.price;

  inventory.push(purchasedItem);

  if (
    shopCursor >= shop.items.length
  ) {
    shopCursor = Math.max(
      0,
      shop.items.length - 1
    );
  }

  showMessage(
    "✅ ITEM PURCHASED",
    [
      (
        "You purchased the "
        + `${purchasedItem.condition} `
        + `${purchasedItem.originalName}`
      ),
      (
        `for ${purchasedItem.price} sp.`
      ),
      "",
      (
        "The item was added "
        + "to your inventory."
      ),
      "",
      `🪙 Allowance: ${silver} sp`,
    ],
    "shop"
  );
}


// =========================================================
// IDENTIFIER INPUT
// =========================================================

function handleIdentifierInput(key) {
  if (
    key === "b"
    || key === "escape"
  ) {
    currentView = "bazaar";
    render();
  }

  else if (key === "q") {
    leaveBazaar();
  }

  else if (
    inventory.length === 0
  ) {
    return;
  }

  else if (
    key === "w"
    || key === "arrowup"
  ) {
    identifierCursor = (
      identifierCursor
      - 1
      + inventory.length
    ) % inventory.length;

    render();
  }

  else if (
    key === "s"
    || key === "arrowdown"
  ) {
    identifierCursor = (
      identifierCursor + 1
    ) % inventory.length;

    render();
  }

  else if (key === "enter") {
    const item = (
      inventory[identifierCursor]
    );

    if (item.identified) {
      currentView = "identifiedItem";
      messageReturnView = "identifier";

      renderIdentifiedItem(
        item,
        "🔍 ITEM ALREADY IDENTIFIED"
      );

      return;
    }

    if (silver < 1) {
      showMessage(
        "❌ NOT ENOUGH SILVER",
        [
          (
            "The Identifier "
            + "charges 1 sp."
          ),
          (
            "You have no silver "
            + "remaining."
          ),
        ],
        "identifier"
      );

      return;
    }

    pendingItemIndex = (
      identifierCursor
    );

    currentView = (
      "identifyPrompt"
    );

    render();
  }
}


// =========================================================
// IDENTIFY PROMPT INPUT
// =========================================================

function handleIdentifyPromptInput(key) {
  if (
    key === "n"
    || key === "escape"
    || key === "b"
  ) {
    currentView = "identifier";
    render();
    return;
  }

  if (
    key !== "y"
    && key !== "enter"
  ) {
    return;
  }

  const item = (
    inventory[pendingItemIndex]
  );

  silver -= 1;
  item.identified = true;

  assignIdentifierPrize(item);

  currentView = "identifiedItem";
  messageReturnView = "identifier";

  renderIdentifiedItem(
    item,
    "🔍 IDENTIFICATION COMPLETE"
  );
}


// =========================================================
// MESSAGE INPUT
// =========================================================

function handleMessageInput(key) {
  if (
    key === "enter"
    || key === "escape"
    || key === "b"
  ) {
    currentView = messageReturnView;
    render();
  }
}


// =========================================================
// IDENTIFIED ITEM INPUT
// =========================================================

function handleIdentifiedItemInput(key) {
  if (
    key === "enter"
    || key === "escape"
    || key === "b"
  ) {
    currentView = messageReturnView;
    render();
  }
}


// =========================================================
// SUMMARY INPUT
// =========================================================

function handleSummaryInput(key) {
  if (
    key === "r"
    || key === "enter"
  ) {
    resetMarketDay();
  }
}


// =========================================================
// KEYBOARD CONTROLS
// =========================================================

document.addEventListener(
  "keydown",
  (event) => {
    const key = (
      event.key.toLowerCase()
    );

    const blockedKeys = [
      "arrowup",
      "arrowdown",
      "enter",
      " ",
      "escape",
    ];

    if (blockedKeys.includes(key)) {
      event.preventDefault();
    }

    if (currentView === "bazaar") {
      handleBazaarInput(key);
    }

    else if (currentView === "shop") {
      handleShopInput(key);
    }

    else if (
      currentView === "purchase"
    ) {
      handlePurchaseInput(key);
    }

    else if (
      currentView === "identifier"
    ) {
      handleIdentifierInput(key);
    }

    else if (
      currentView === "identifyPrompt"
    ) {
      handleIdentifyPromptInput(key);
    }

    else if (
      currentView === "message"
    ) {
      handleMessageInput(key);
    }

    else if (
      currentView === "identifiedItem"
    ) {
      handleIdentifiedItemInput(key);
    }

    else if (
      currentView === "summary"
    ) {
      handleSummaryInput(key);
    }
  }
);


// =========================================================
// START
// =========================================================

resetMarketDay();