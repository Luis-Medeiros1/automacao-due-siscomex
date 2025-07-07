require("dotenv").config();
console.log("🔑 API Key carregada:", process.env.API_2CAPTCHA);

const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cors = require("cors");
const bodyParser = require("body-parser");

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/api/checkStatus", async (req, res) => {
    const { dueNumber } = req.body;

    if (!dueNumber) {
        return res.status(400).json({ error: "Número da DU-E é obrigatório" });
    }

    try {
        console.log("🚀 Iniciando Puppeteer...");
        const browser = await puppeteer.launch({ 
            headless: false,
            args: ["--disable-blink-features=AutomationControlled"]
        });

        const page = await browser.newPage();
        console.log("🌍 Acessando o portal...");

        await page.goto("https://portalunico.siscomex.gov.br/due/25BR000445054-8/#/consulta/consulta-filtro?perfil=publico", { 
            waitUntil: ["domcontentloaded", "networkidle2"]
        });

        console.log("📌 Página carregada!");

        // **Listar todos os iframes**
        const iframes = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("iframe")).map(iframe => iframe.src);
        });

        console.log("🧐 Iframes encontrados:", iframes);

        // **Listar todos os campos input da página**
        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("input")).map(input => ({
                name: input.name,
                id: input.id,
                class: input.className,
                formcontrolname: input.getAttribute("formcontrolname")
            }));
        });

        console.log("🧐 Campos de entrada encontrados:", inputs);

        if (inputs.length === 0) {
            console.error("❌ Nenhum campo de DU-E encontrado!");
            await new Promise(resolve => setTimeout(resolve, 60000)); // Manter o navegador aberto para depuração
            await browser.close();
            return res.status(500).json({ error: "Campo da DU-E não encontrado" });
        }

        await new Promise(resolve => setTimeout(resolve, 60000)); // Manter aberto para depuração
        await browser.close();
        res.json({ success: true });

    } catch (error) {
        console.error("❌ Erro ao consultar DU-E:", error);
        res.status(500).json({ error: "Erro ao consultar DU-E" });
    }
});

app.listen(5000, () => {
    console.log("🚀 Servidor rodando na porta 5000");
});
