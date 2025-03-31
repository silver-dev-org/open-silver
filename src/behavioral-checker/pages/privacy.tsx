import { NAME } from "@/behavioral-checker/constants";

export default function Privacy() {
  return (
    <div className="container max-w-screen-md">
      <h1 className="text-xl lg:text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-6">
        Thank you for using {NAME}. Your privacy is very important to us, and we
        are committed to being transparent about how we handle your data. Below
        are the details of our privacy practices:
      </p>
      <ul className="list-disc pl-4">
        <li className="mb-4">
          <p className="font-bold mb-2">Storage of your data</p>
          <p>
            {NAME} processes and stores your recorded responses to behavioral
            interview questions. This data is retained solely for the purpose of
            improving the underlying AI model and enhancing the overall user
            experience.
          </p>
        </li>
        <li className="mb-4">
          <p className="font-bold mb-2">
            Use of artificial intelligence technology
          </p>
          <p>
            Our app leverages advanced AI technology, including OpenAI models,
            to analyze your responses and provide feedback, such as identifying
            green and red flags. Additionally, OpenAI is used to perform
            speech-to-text translations for your recorded responses. This
            analysis and transcription are conducted securely, and your data is
            not shared with unauthorized third parties.
          </p>
        </li>
        <li className="mb-4">
          <p className="font-bold mb-2">Data security</p>
          <p>
            We prioritize the security of your data. All recordings and related
            information are stored in a secure environment to prevent
            unauthorized access or misuse.
          </p>
        </li>
        <li className="mb-4">
          <p className="font-bold mb-2">Third-party services</p>
          <p>
            {NAME} uses OpenAI&apos;s services for speech-to-text processing and
            response analysis. OpenAI operates under its own privacy and
            security policies, which are designed to handle data responsibly.
          </p>
        </li>
        <li className="mb-4">
          <p className="font-bold mb-2">Your consent</p>
          <p>
            By using {NAME}, you consent to the collection, storage, and
            analysis of your data as described in this Privacy Policy.
          </p>
        </li>
      </ul>
    </div>
  );
}
