import Heading from "@/components/heading";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Heading description="Open Source Software made by Silver.dev and its contributors.">
        <span className="text-primary">Open</span> Silver
      </Heading>
      <section className="mt-32 space-y-8">
        <h1 className="text-4xl">For talent</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href=""
            className="hover:bg-accent transition-all duration-300 rounded-lg text-center"
          >
            <Card>
              <CardHeader>
                <CardTitle>Resume Checker</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link
            href=""
            className="hover:bg-accent transition-all duration-300 rounded-lg text-center"
          >
            <Card>
              <CardHeader>
                <CardTitle>Behavioral Checker</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link
            href=""
            className="hover:bg-accent transition-all duration-300 rounded-lg text-center"
          >
            <Card>
              <CardHeader>
                <CardTitle>WPM Checker</CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link
            href=""
            className="hover:bg-accent transition-all duration-300 rounded-lg text-center"
          >
            <Card>
              <CardHeader>
                <CardTitle>Takehome Checker</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>
      <section className="mt-32 space-y-8">
        <h1 className="text-4xl">For companies</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href=""
            className="hover:bg-accent transition-all duration-300 rounded-lg text-center"
          >
            <Card>
              <CardHeader>
                <CardTitle>Contract Negotiation Tool</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
