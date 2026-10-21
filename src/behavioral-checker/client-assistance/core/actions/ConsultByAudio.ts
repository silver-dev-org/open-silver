import { Question } from "@/behavioral-checker/data/questions";
import type { RouteLog } from "@/lib/route-log";
import { AssistanceResponse } from "../domain/Action";
import {
  clientAssistanceService,
  ClientAssistanceService,
} from "../domain/ClientAssitanceService";
import { sttClient, STTClient } from "../domain/STTClient";

class ConsultByAudio {
  constructor(
    private readonly sttClient: STTClient,
    private readonly clientAssistanceService: ClientAssistanceService,
  ) {}

  async invoke(
    id: Question["id"],
    question: string,
    audioPath: string,
    log: RouteLog,
  ): Promise<AssistanceResponse> {
    log.phase("transcribe");
    const content = await this.sttClient.transcribeAudio(audioPath);
    log.phase("consult");
    return await this.clientAssistanceService.consultByText(
      id,
      question,
      content,
      log,
    );
  }
}

export const consultByAudio = new ConsultByAudio(
  sttClient,
  clientAssistanceService,
);
