import { Question } from "@/behavioral-checker/data/questions";
import { AssistanceResponse } from "../domain/Action";
import {
  clientAssistanceService,
  ClientAssistanceService,
} from "../domain/ClientAssitanceService";
import { sttClient, STTClient } from "../domain/STTClient";

class ConsultByAudio {
  constructor(
    private readonly sttClient: STTClient,
    private readonly clientAssistanceService: ClientAssistanceService
  ) {}

  async invoke(
    id: Question["id"],
    question: string,
    audioPath: string
  ): Promise<AssistanceResponse> {
    console.log("Consulting by audio:", audioPath);
    console.time("Transcribe Audio");
    const content = await this.sttClient.transcribeAudio(audioPath);
    console.timeEnd("Transcribe Audio");
    console.time("Consult By Text");
    const response = await this.clientAssistanceService.consultByText(
      id,
      question,
      content
    );
    console.timeEnd("Consult By Text");

    return response;
  }
}

export const consultByAudio = new ConsultByAudio(
  sttClient,
  clientAssistanceService
);
