import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AnalysisResult } from "@/take-home-checker/types/repo";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Eye,
  FileText,
  XCircle,
} from "lucide-react";

interface ProjectAnalysisProps extends AnalysisResult {}

const scores = {
  "strong-yes": {
    color: "bg-green-500",
    text: "Strong Yes",
  },
  yes: {
    color: "bg-green-500",
    text: "Yes",
  },
  no: {
    color: "bg-red-500",
    text: "No",
  },
  "strong-no": {
    color: "bg-green-500",
    text: "Strong no",
  },
};

export default function ProjectAnalysis({
  score,
  documentationFeedback,
  codeFeedback,
  prompts,
}: ProjectAnalysisProps) {
  const { color, text } = scores[score];

  return (
    <div className="space-y-6 mx-auto max-w-[130ch]">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex gap-3 items-center">
              <Badge className={`text-lg px-4 py-2 ${color}`}>{text}</Badge>
              <h3 className="text-lg font-semibold text-muted-foreground">
                Project Score
              </h3>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye />
                  View Prompts
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Analysis Prompts</DialogTitle>
                  <DialogDescription>
                    The prompts used to analyze your repository
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                  <div className="flex flex-col gap-6 ">
                  <Separator />
                    <h4 className="font-semibold">
                      Documentation Analysis Prompt
                    </h4>
                    <p
                      className="text-sm text-muted-foreground bg-muted p-3 rounded whitespace-pre-wrap"
                    >
                      {prompts.documentation}
                    </p>
                    <h4 className="font-semibold">Code Analysis Prompt</h4>
                    <p
                      className="text-sm text-muted-foreground bg-muted p-3 rounded whitespace-pre-wrap"
                    >
                      {prompts.code}
                    </p>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText />
              <h4>Documentation</h4>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentationFeedback.green.length > 0 && (
              <div>
                <h5 className="font-semibold text-green-500 flex items-center gap-3">
                  <CheckCircle className="size-4" />
                  Strengths
                </h5>
                <ul className="list-disc list-inside pl-1.5">
                  {documentationFeedback.green.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {documentationFeedback.yellow.length > 0 && (
              <div>
                <h5 className="font-semibold text-yellow-500 flex items-center gap-3">
                  <AlertTriangle className="size-4" />
                  Areas of Improvement
                </h5>
                <ul className="list-disc list-inside pl-1.5">
                  {documentationFeedback.yellow.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {documentationFeedback.red.length > 0 && (
              <div>
                <h5 className="font-semibold text-red-500 flex items-center gap-3">
                  <XCircle className="size-4" />
                  Critical Issues
                </h5>
                <ul className="list-disc list-inside pl-1.5">
                  {documentationFeedback.red.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code />
              <h4>Code</h4>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {codeFeedback.green.length > 0 && (
              <div>
                <h5 className="font-semibold text-green-500 flex items-center gap-3">
                  <CheckCircle className="size-4" />
                  Strengths
                </h5>
                <ul className="list-disc list-inside pl-1.5">
                  {codeFeedback.green.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {codeFeedback.yellow.length > 0 && (
              <div>
                <h5 className="font-semibold text-yellow-500 flex items-center gap-3">
                  <AlertTriangle className="size-4" />
                  Areas of Improvement
                </h5>
                <ul className="list-disc list-inside pl-1.5">
                  {codeFeedback.yellow.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {codeFeedback.red.length > 0 && (
              <div>
                <h5 className="font-semibold text-red-500 flex items-center gap-3">
                  <XCircle className="size-4" />
                  Critical Issues
                </h5>
                <ul className="list-disc list-inside pl-1.5">
                  {codeFeedback.red.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
