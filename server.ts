import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Payment Initiation
  app.post("/api/payments/initiate", async (req, res) => {
    try {
      const { userId, planId, amount, phoneNumber, customerName } = req.body;

      if (!userId || !amount || !phoneNumber) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const apiUrl = process.env.MONEYFUSION_API_URL || "https://www.pay.moneyfusion.net/payement";
      
      const paymentData = {
        totalPrice: amount,
        article: [
          {
            [planId || "premium_sub"]: amount,
          },
        ],
        personal_Info: [
          {
            userId: userId,
          },
        ],
        numeroSend: phoneNumber,
        nomclient: customerName || "Client Epreuve +",
        return_url: process.env.APP_CALLBACK_URL || "https://monepreuve.cc/api/payments/callback",
        webhook_url: process.env.APP_CALLBACK_URL || "https://monepreuve.cc/api/payments/callback",
      };

      console.log("Initiating payment with MoneyFusion:", paymentData);

      const response = await axios.post(apiUrl, paymentData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.statut) {
        // Create a pending transaction record
        await db.collection("payments").doc(response.data.token).set({
          userId,
          token: response.data.token,
          amount,
          status: "pending",
          createdAt: new Date().toISOString(),
          phoneNumber,
        });

        res.json(response.data);
      } else {
        res.status(500).json({ error: "MoneyFusion initiation failed", details: response.data });
      }
    } catch (error: any) {
      console.error("Payment initiation error:", error.response?.data || error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Unified Callback for both Return (Redirect) and Webhook
  app.all("/api/payments/callback", async (req, res) => {
    // If it's a browser redirection (GET)
    if (req.method === "GET") {
      console.log("User redirected back from payment:", req.query);
      // We redirect them to the profile page on the frontend
      return res.redirect("/profile?payment=check");
    }

    // If it's a webhook notification (POST)
    if (req.method === "POST") {
      try {
        const payload = req.body;
        console.log("Received Webhook from MoneyFusion:", payload);

        const { event, tokenPay, personal_Info } = payload;
        
        if (!tokenPay) {
          return res.status(400).send("No token provided");
        }

        const paymentRef = db.collection("payments").doc(tokenPay);
        const paymentDoc = await paymentRef.get();

        if (!paymentDoc.exists) {
          console.warn(`Payment token ${tokenPay} not found in database.`);
          return res.status(404).send("Payment not found");
        }

        const paymentData = paymentDoc.data();
        const userId = paymentData?.userId || (personal_Info && personal_Info[0]?.userId);

        if (event === "payin.session.completed") {
          await paymentRef.update({
            status: "paid",
            updatedAt: new Date().toISOString(),
          });

          if (userId) {
            const userRef = db.collection("users").doc(userId);
            await userRef.update({
              isPremium: true,
              premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            });
            console.log(`User ${userId} granted premium.`);
          }
        } else if (event === "payin.session.cancelled") {
          await paymentRef.update({
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          });
        }

        return res.status(200).send("OK");
      } catch (error) {
        console.error("Webhook processing error:", error);
        return res.status(500).send("Internal server error");
      }
    }
    
    res.status(405).send("Method not allowed");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
