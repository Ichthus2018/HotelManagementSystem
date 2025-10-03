const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// --- TTLock Configuration ---
const CLIENT_ID = "df9cc9624a0645deb4321f184d63abd6";
const CLIENT_SECRET = "022541df64527d48d0499df4b5ee72e7";
const TTLOCK_API_URL = "https://euapi.ttlock.com";

// --- Local storage for tokens ---
const TOKENS_FILE = path.join(__dirname, "tokens.json");

// --- Token Management ---
async function loadTokens() {
  try {
    const txt = await fs.readFile(TOKENS_FILE, "utf8");
    return JSON.parse(txt);
  } catch (error) {
    return null;
  }
}

async function saveTokens(tokens) {
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

function tokenExpired(tokens) {
  if (!tokens || !tokens.expires_at) return true;
  return Date.now() > tokens.expires_at;
}

async function requestAccessTokenWithPassword(username, passwordPlain) {
  const md5Password = crypto
    .createHash("md5")
    .update(passwordPlain)
    .digest("hex")
    .toLowerCase();

  const params = new URLSearchParams();
  params.append("clientId", CLIENT_ID);
  params.append("clientSecret", CLIENT_SECRET);
  params.append("username", username);
  params.append("password", md5Password);

  const res = await axios.post(
    `${TTLOCK_API_URL}/oauth2/token`,
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const data = res.data;

  const expires_at = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;
  const tokensToSave = { ...data, expires_at };
  await saveTokens(tokensToSave);
  return tokensToSave;
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams();
  params.append("clientId", CLIENT_ID);
  params.append("clientSecret", CLIENT_SECRET);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const res = await axios.post(
    `${TTLOCK_API_URL}/oauth2/token`,
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const data = res.data;
  const expires_at = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;
  const tokensToSave = { ...data, expires_at };
  await saveTokens(tokensToSave);
  return tokensToSave;
}

async function ensureAccessToken() {
  const currentTokens = await loadTokens();
  if (!currentTokens) {
    throw new Error(
      "No token stored. Please log in first via /api/auth/login."
    );
  }
  if (!tokenExpired(currentTokens)) {
    return currentTokens;
  }
  return await refreshAccessToken(currentTokens.refresh_token);
}

// --- Centralized API Request Helper ---

async function ttlockApiRequest(method, endpoint, data = {}) {
  const tokens = await ensureAccessToken();
  const requestData = {
    clientId: CLIENT_ID,
    accessToken: tokens.access_token,
    date: Date.now(),
    ...data,
  };

  const config = {
    method,
    url: `${TTLOCK_API_URL}${endpoint}`,
  };

  if (method.toLowerCase() === "get") {
    config.params = requestData;
  } else if (method.toLowerCase() === "post") {
    const params = new URLSearchParams();
    for (const key in requestData) {
      params.append(key, requestData[key]);
    }
    config.data = params.toString();
    config.headers = { "Content-Type": "application/x-www-form-urlencoded" };
  }

  const response = await axios(config);

  // TTLock API sometimes returns an error object even with a 200 status code
  if (response.data.errcode && response.data.errcode !== 0) {
    throw new Error(
      response.data.errmsg ||
        `TTLock API Error with code: ${response.data.errcode}`
    );
  }

  return response.data;
}

// --- API Routes ---

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password required" });
    }
    const tokens = await requestAccessTokenWithPassword(username, password);
    res.json({ ok: true, uid: tokens.uid, expires_at: tokens.expires_at });
  } catch (err) {
    res.status(500).json({ error: err?.response?.data || err.message });
  }
});

app.get("/api/locks", async (req, res) => {
  try {
    const data = await ttlockApiRequest("get", "/v3/lock/list", {
      pageNo: 1,
      pageSize: 100,
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.post("/api/locks/:lockId/unlock", async (req, res) => {
  try {
    const { lockId } = req.params;
    if (!lockId) return res.status(400).json({ error: "lockId required" });

    const data = await ttlockApiRequest("post", "/v3/lock/unlock", {
      lockId: parseInt(lockId),
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.post("/api/locks/:lockId/lock", async (req, res) => {
  try {
    const { lockId } = req.params;
    if (!lockId) return res.status(400).json({ error: "lockId required" });

    const data = await ttlockApiRequest("post", "/v3/lock/lock", {
      lockId: parseInt(lockId),
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.get("/api/locks/:lockId/state", async (req, res) => {
  try {
    const { lockId } = req.params;
    if (!lockId) return res.status(400).json({ error: "lockId required" });

    const data = await ttlockApiRequest("get", "/v3/lock/queryOpenState", {
      lockId: parseInt(lockId),
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.get("/api/locks/:lockId/battery", async (req, res) => {
  try {
    const { lockId } = req.params;
    if (!lockId) return res.status(400).json({ error: "lockId required" });

    const data = await ttlockApiRequest(
      "get",
      "/v3/lock/queryElectricQuantity",
      { lockId: parseInt(lockId) }
    );
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.get("/api/gateways", async (req, res) => {
  try {
    const data = await ttlockApiRequest("get", "/v3/gateway/list", {
      pageNo: 1,
      pageSize: 50,
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.delete("/api/gateways/:gatewayId", async (req, res) => {
  try {
    const { gatewayId } = req.params;
    if (!gatewayId) {
      return res.status(400).json({ error: "gatewayId is required" });
    }
    const data = await ttlockApiRequest("post", "/v3/gateway/delete", {
      gatewayId: parseInt(gatewayId),
    });
    if (data.errcode !== 0) {
      return res.status(400).json({
        error: data.errmsg || `TTLock API Error: ${data.errcode}`,
      });
    }

    res.json({ message: "Gateway deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.get("/api/gateways/:gatewayId/locks", async (req, res) => {
  try {
    const { gatewayId } = req.params;
    if (!gatewayId)
      return res.status(400).json({ error: "gatewayId is required" });

    const data = await ttlockApiRequest("get", "/v3/gateway/listLock", {
      gatewayId: parseInt(gatewayId),
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

// --- IC Card Routes ---

app.get("/api/cards", async (req, res) => {
  try {
    // 1. First, get a list of all locks
    const locksResponse = await ttlockApiRequest("get", "/v3/lock/list", {
      pageNo: 1,
      pageSize: 100, // Adjust as needed
    });

    if (!locksResponse.list || locksResponse.list.length === 0) {
      return res.json({ list: [], total: 0 });
    }

    // 2. Create a promise to fetch cards for each lock
    const cardRequests = locksResponse.list.map((lock) =>
      ttlockApiRequest("get", "/v3/identityCard/list", {
        lockId: lock.lockId,
        pageNo: 1,
        pageSize: 200, // Adjust as needed
      })
        .then((cardData) => {
          // 3. Add lock information to each card for context
          return cardData.list.map((card) => ({
            ...card,
            lockId: lock.lockId,
            lockAlias: lock.lockAlias,
          }));
        })
        .catch((error) => {
          console.error(
            `Failed to fetch cards for lock ${lock.lockAlias} (${lock.lockId}): ${error.message}`
          );
          return [];
        })
    );

    // 4. Wait for all card requests to complete
    const results = await Promise.all(cardRequests);

    // 5. Flatten the array of arrays into a single list of all cards
    const allCards = results.flat();

    res.json({ list: allCards, total: allCards.length });
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.get("/api/locks/:lockId/cards", async (req, res) => {
  try {
    const { lockId } = req.params;
    const data = await ttlockApiRequest("get", "/v3/identityCard/list", {
      lockId: parseInt(lockId),
      pageNo: 1,
      pageSize: 200,
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

app.post("/api/locks/:lockId/cards", async (req, res) => {
  try {
    const { lockId } = req.params;
    const { cardNumber, cardName, startDate, endDate } = req.body;

    if (!cardNumber || !cardName) {
      return res
        .status(400)
        .json({ error: "cardNumber and cardName are required" });
    }

    // Call the TTLock "addForReversedCardNumber" API
    const data = await ttlockApiRequest(
      "post",
      "/v3/identityCard/addForReversedCardNumber",
      {
        lockId: parseInt(lockId),
        cardNumber, // raw number from your reader (E3)
        cardName,
        startDate: startDate || 0,
        endDate: endDate || 0,
        addType: 2, // 2 = via gateway
      }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err?.response?.data || { message: err.message },
    });
  }
});

app.delete("/api/locks/:lockId/cards/:cardId", async (req, res) => {
  try {
    const { lockId, cardId } = req.params;
    const data = await ttlockApiRequest("post", "/v3/identityCard/delete", {
      lockId: parseInt(lockId),
      cardId: parseInt(cardId),
      deleteType: 2, // 2 = Delete via gateway remotely
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

// +++ NEW: Clear all IC cards from a lock +++
app.post("/api/locks/:lockId/cards/clear", async (req, res) => {
  try {
    const { lockId } = req.params;
    const data = await ttlockApiRequest("post", "/v3/identityCard/clear", {
      lockId: parseInt(lockId),
    });
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

// +++ NEW: Change the period of validity of an IC card +++
app.put("/api/locks/:lockId/cards/:cardId", async (req, res) => {
  try {
    const { lockId, cardId } = req.params;
    const { startDate, endDate } = req.body;

    const payload = {
      lockId: parseInt(lockId),
      cardId: parseInt(cardId),
      changeType: 2,
    };

    if (startDate !== undefined) {
      payload.startDate = startDate;
    }
    if (endDate !== undefined) {
      payload.endDate = endDate;
    }

    const data = await ttlockApiRequest(
      "post",
      "/v3/identityCard/changePeriod",
      payload
    );
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ error: err?.response?.data || { message: err.message } });
  }
});

// --- Start server ---
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);
