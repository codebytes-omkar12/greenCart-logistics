import { Request, Response } from 'express';
// --- UPDATED IMPORT ---
import { GoogleGenAI } from "@google/genai";
import { Simulation, ISimulation, Driver, IDriver, Order, IOrder, IRoute } from '../models';


// --- HELPER FUNCTION FROM YOUR EXAMPLE ---
// Initializes the AI client, using the API key from the .env file.
function getAiClient() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not found in .env file.');
    }
    // Note: The example uses GoogleGenAI, so we use it here.
    return new GoogleGenAI({ apiKey });
}


// This helper function creates the "typing effect" for the client
const streamTextToClient = (res: Response, text: string) => {
    // ... (This function remains unchanged)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const words = text.split(' ');
    let wordIndex = 0;
    const intervalId = setInterval(() => {
        if (wordIndex < words.length) {
            res.write(words[wordIndex] + ' ');
            wordIndex++;
        } else {
            clearInterval(intervalId);
            res.end();
        }
    }, 120);
    res.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
};

export const getSimulations = async (req: Request, res: Response) => {
    try {
        const simulations = await Simulation.find().sort({ timestamp: -1 }).limit(10);
        res.json(simulations);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching simulation history", error: error.message });
    }
};

export const runSimulation = async (req: Request, res: Response) => {
    try {
        const { numDrivers, maxHours, startTime } = req.body;
        if (!numDrivers || !maxHours || !startTime || numDrivers <= 0 || maxHours <= 0) {
            return res.status(400).json({ message: "Number of drivers, max hours, and start time are required and must be positive." });
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
            return res.status(400).json({ message: 'Invalid start time format. Please use HH:MM.' });
        }
        const availableDrivers: IDriver[] = await Driver.find().limit(numDrivers);
        if (availableDrivers.length < numDrivers) {
            return res.status(400).json({ message: `Simulation requires ${numDrivers} drivers, but only ${availableDrivers.length} are in the database.` });
        }
        const pendingOrders: IOrder[] = await Order.find({ deliveryTimestamp: { $exists: false } }).populate('assignedRoute');
        if (pendingOrders.length === 0) {
            return res.status(400).json({ message: "No pending orders to simulate." });
        }
        const dailyWorkLog = new Map<string, number>();
        availableDrivers.forEach(driver => {
            if (driver._id) {
                dailyWorkLog.set(driver._id.toString(), 0);
            }
        });
        let totalProfit = 0;
        let onTimeDeliveries = 0;
        let lateDeliveries = 0;
        const fuelCostBreakdown: { [key: string]: number } = { Low: 0, Medium: 0, High: 0 };
        for (let i = 0; i < pendingOrders.length; i++) {
            const order = pendingOrders[i];
            const driver = availableDrivers[i % numDrivers];
            const route = order.assignedRoute as IRoute;
            if (!route || !driver._id) continue;
            let deliveryTime = route.baseTime;
            if (driver.isFatigued) {
                deliveryTime *= 1.30;
            }
            const deliveryHours = deliveryTime / 60;
            const currentHours = dailyWorkLog.get(driver._id.toString()) || 0;
            if (currentHours + deliveryHours <= maxHours) {
                dailyWorkLog.set(driver._id.toString(), currentHours + deliveryHours);
                const isLate = deliveryTime > (route.baseTime + 10);
                let penalty = isLate ? 50 : 0;
                if (isLate) lateDeliveries++; else onTimeDeliveries++;
                let bonus = (order.value_rs > 1000 && !isLate) ? order.value_rs * 0.10 : 0;
                let fuelCost = route.distance * 5;
                if (route.trafficLevel === 'High') {
                    fuelCost += route.distance * 2;
                }
                fuelCostBreakdown[route.trafficLevel] += fuelCost;
                totalProfit += (order.value_rs + bonus - penalty - fuelCost);
            }
        }
        const efficiencyScore = pendingOrders.length > 0 ? (onTimeDeliveries / pendingOrders.length) * 100 : 0;
        for (const driver of availableDrivers) {
            if (!driver._id) continue;
            const hoursWorked = dailyWorkLog.get(driver._id.toString()) || 0;
            driver.isFatigued = hoursWorked > 8;
            driver.past7DayWorkHours.shift();
            driver.past7DayWorkHours.push(hoursWorked);
            await driver.save();
        }
        const newSimulation = new Simulation({
            totalProfit, efficiencyScore, onTimeDeliveries, lateDeliveries, fuelCostBreakdown
        });
        await newSimulation.save();
        res.status(201).json(newSimulation);
    } catch (error: any) {
        console.error("Simulation Error:", error);
        res.status(500).json({ message: 'An error occurred during the simulation.', error: error.message });
    }
};


export const generateAiSummary = async (req: Request, res: Response) => {
    try {
        // --- UPDATED: Get AI client for each request ---
        const ai = getAiClient();

        const { id } = req.params;
        const simulation: ISimulation | null = await Simulation.findById(id);

        if (!simulation) {
            return res.status(404).json({ message: 'Simulation not found.' });
        }

        if (simulation.aiSummary && simulation.tags.length > 0) {
            return streamTextToClient(res, simulation.aiSummary);
        }

        const prompt = `You are an expert operations analyst for GreenCart Logistics. Your task is to analyze simulation data and return a structured JSON object.

                **CRITICAL RULES:**
                - You MUST respond with only a raw JSON object.
                - Do NOT use markdown formatting like \`\`\`json.
                - Do NOT include any text or explanation outside of the JSON object.

                **JSON STRUCTURE:**
                The JSON object must contain two keys:
                1.  "summary": A professional, concise summary (max 3 sentences) that starts with profitability/efficiency, highlights the most significant factor, and concludes with one actionable recommendation.
                2.  "tags": An array of 3-5 short, descriptive strings reflecting the key outcomes (e.g., "High Profit", "Poor Efficiency", "High Fuel Costs").

                **EXAMPLE OUTPUT:**
                {
                "summary": "The simulation was profitable, but efficiency was low due to a high number of late deliveries. Re-evaluating high-traffic routes is recommended to improve delivery times and overall performance.",
                "tags": ["Profitable", "Low Efficiency", "High Late Penalties", "Route Optimization Needed"]
                }

                ---

                **SIMULATION DATA TO ANALYZE:**
                - Total Profit: Rs. ${simulation.totalProfit.toFixed(2)}
                - Efficiency Score: ${simulation.efficiencyScore.toFixed(2)}%
                - On-time Deliveries: ${simulation.onTimeDeliveries}
                - Late Deliveries: ${simulation.lateDeliveries}
                - Fuel Cost Breakdown: ${JSON.stringify(simulation.fuelCostBreakdown)}
                `;
        // --- UPDATED: Call the API using the new SDK's syntax from your example ---
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: 0.2,
                maxOutputTokens: 500,
            },
        });

        // --- Assemble the full response from the stream ---
        let responseText = '';
        // The new SDK returns the stream directly on the response object
        for await (const chunk of response) {
            responseText += (chunk.text || '');
        }

        // --- FIX: Clean the response text before parsing ---
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        // --- (Parsing and saving logic is unchanged) ---
        const aiResponse = JSON.parse(cleanedText);
        const { summary, tags } = aiResponse;

        if (!summary || !tags || !Array.isArray(tags)) {
            throw new Error("AI response was not in the expected JSON format.");
        }

        simulation.aiSummary = summary;
        simulation.tags = tags;
        await simulation.save();
        
        streamTextToClient(res, summary);

    } catch (error: any) {
        // --- (Error handling is unchanged) ---
        console.error('Gemini API error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('429') || /rateLimitExceeded|quota/i.test(errorMessage)) {
            return res.status(429).send('API rate limit exceeded.');
        }
        res.status(500).json({
            error: 'Failed to get AI summary',
            details: errorMessage,
        });
    }
};



