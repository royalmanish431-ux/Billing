import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to proxy SheetDB
  app.post("/api/save-custom-bill", async (req, res) => {
    try {
      const response = await fetch("https://sheetdb.io/api/v1/kuvwdspgcg4ac", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [req.body] }),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error saving to SheetDB:", error);
      res.status(500).json({ error: "Failed to save to SheetDB" });
    }
  });

  app.get("/api/search-product", async (req, res) => {
    const { bill_no } = req.query;
    try {
      // 1. Check SheetDB
      const sheetResponse = await fetch(`https://sheetdb.io/api/v1/kuvwdspgcg4ac/search?bill_no=${bill_no}`);
      const sheetData = await sheetResponse.json();
      
      if (sheetData && Array.isArray(sheetData) && sheetData.length > 0) {
        return res.json(sheetData);
      }

      // 2. Fallback: Check Open Food Facts
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${bill_no}.json`);
      const offData = await offResponse.json();

      if (offData && offData.status === 1 && offData.product) {
        const product = offData.product;
        return res.json([{
            bill_no: bill_no,
            item_name: product.product_name || product.generic_name || `Item ${bill_no}`,
            price: product.price || '99',
            qty: '1',
            stock: '10',
            gst: '0'
        }]);
      }

      res.json([]);
    } catch (error) {
      console.error("Error searching in SheetDB/OpenFoodFacts:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
