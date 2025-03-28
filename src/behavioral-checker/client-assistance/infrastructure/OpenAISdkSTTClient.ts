import OpenAI from "openai";
import fs from 'fs';
import path from 'path';
import { STTClient } from "../core/domain/STTClient";

export class OpenAISdkSTTSClient implements STTClient {

    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async transcribeAudio(p: string): Promise<string> {
        const audioPath = path.resolve(p);

        const response = await this.client.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: 'whisper-1',
        });

        return response.text;
    }

}