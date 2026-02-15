import mongoose from 'mongoose';
import Canvas from '../src/models/Canvas.model.js';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shadow_canvas';

async function check() {
    try {
        await mongoose.connect(uri);
        // Find last 3 canvases
        const canvases = await Canvas.find().sort({ updatedAt: -1 }).limit(3);

        console.log(`Found ${canvases.length} canvases.`);
        canvases.forEach((c, i) => {
            console.log(`[${i}] Title: "${c.title}"`);
            console.log(`    ID: ${c._id}`);
            console.log(`    Thumbnail Length: ${c.thumbnail ? c.thumbnail.length : 0}`);
            if (c.thumbnail && c.thumbnail.length > 0) {
                console.log(`    Thumbnail Start: ${c.thumbnail.substring(0, 30)}...`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
