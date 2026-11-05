import { GatewaySTTClient } from "@/behavioral-checker/client-assistance/infrastructure/gateway-stt-client";

export interface STTClient {
  transcribeAudio(audioPath: string): Promise<string>;
}

export const sttClient = new GatewaySTTClient();
