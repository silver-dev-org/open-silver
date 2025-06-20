import Description from "@/components/description";
import Divider from "@/components/divider";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer, { spaceSizes } from "@/components/spacer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TestimonialsCarousel } from "@/mentors/components/testimonials-carousel";
import {
  BriefcaseBusiness,
  CircleFadingArrowUp,
  HeartHandshake,
  Keyboard,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    title: "Superá tus límites y dejá de pasarla mal",
    description:
      "Entrevistar cuando no te sentís cómodo genera tensión, pero ahora vas a poder simular entrevistas reales y recibir feedback de expertos para mejorar.",
    icon: CircleFadingArrowUp,
  },
  {
    title: "Mejorá tu performance en entrevistas técnicas",
    description:
      "La clave para pasar entrevistas técnicas es llegar con horas de práctica. Ahora también vas a poder sumar el feedback de mentores expertos que te ayudan en el entrenamiento.",
    icon: Keyboard,
  },
  {
    title: "Destacate y enamorá al entrevistador",
    description:
      "Recruiters y hiring managers entrevistan cientos de candidatos. Destacarte hace que dejes de ser uno más, y te ayuda no sólo a pasar una instancia sino a avanzar en el proceso.",
    icon: HeartHandshake,
  },
  {
    title: "Conseguí el trabajo que querés",
    description:
      "Cuanto mejor entrevistes, más ofertas vas a conseguir. Las mock interviews te ayudan a corregir errores por anticipado, llegar con más seguridad y romperla en el momento de la verdad.",
    icon: BriefcaseBusiness,
  },
];

const steps = [
  "Te registrás y pasás un proceso de admisión.",
  "Se te asigna un coach con sesiones semanales o quincenales y completás el onboarding.",
  "Trabajás en entrevistas, CV y preparación técnica, todo mientras el coach busca oportunidades.",
  "Pagás solo si conseguís un trabajo gracias al programa tras 3 meses de permanencia en el nuevo empleo.",
];

const mentors = [
  {
    name: "Gabriel Benmergui",
    title: "Silver.dev Founder — Staff Engineer",
    price: "$200",
    target: "Head Mentor",
    linkedin: "https://www.linkedin.com/in/gabriel-benmergui/",
    calendly: "https://calendly.com/silver-dev/silver-dev-coaching-session",
    description:
      "Como recruiter y programador te puedo ayudar a entender donde estás parado en el mercado, cuáles son los próximos pasos y cómo pasar cualquier entrevista. Ayudé a gente a entrar en empresas de primera línea global como Google y también a fundar y escalar empresas como founder de Silver.dev.",
    image: "/mentors/gabriel.png",
  },
  {
    name: "Mariano Crosetti",
    title: "ICPC Coach — Ex-Google",
    price: "$75",
    target: "Data Structures & Algorithms (LeetCode)",
    linkedin: "https://www.linkedin.com/in/marianocrosetti/",
    calendly: "https://calendly.com/marianojosecrosetti/interview-prep",
    description:
      "Con mi entrenamiento los candidatos han pasado procesos en Google, Amazon y Microsoft USA. Soy campeón de programación competitiva LatAm y coach de numerosos finalistas mundiales. He desarrollado un método para que cualquier candidato pueda adquirir nivel top-global en entrevistas de LeetCode (Data Structures and Algorithms).",
    image: "/mentors/mariano.jpeg",
  },
  {
    name: "Rodrigo Uroz",
    title: "Senior Software Engineer",
    price: "$75",
    target: "Full Stack Live Coding & System Design",
    linkedin: "https://www.linkedin.com/in/rodrigouroz/",
    calendly: "https://calendly.com/rodrigouroz/techinterview",
    description:
      "Con más de 20 años de experiencia en desarrollo de software, he liderado equipos técnicos y ayudado a muchos desarrolladores a destacarse en entrevistas técnicas. Me especializo en diseño de sistemas y entrevistas de algoritmos. Si querés prepararte a practicar y recibir feedback, soy tu mentor.",
    image: "/mentors/rodrigo.png",
  },
  {
    name: "Marcel",
    title: "English Interview Coach",
    price: "$60",
    target: "Voice Coaching & Storytelling",
    calendly: "https://calendly.com/english_from_mars/interview-mentors",
    description:
      "Experienced English language coach specializing in technical interview preparation. I'll not only make English speakers understand you, but their communication skills, technical vocabulary, and confidence. I'm here to be your support for your interview journey.",
    image: "/mentors/marcel.jpg",
  },
];

export default function MentorsPage() {
  return (
    <>
      <Section>
        <Heading size="lg" center>
          Práctica de entrevistas con{" "}
          <span className="text-primary">entrevistadores</span> reales
        </Heading>
        <Spacer size="lg" />
        <div className="flex justify-center w-full mb-6">
          <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-lg">
            <embed
              src="https://www.youtube.com/embed/simdZc3BkXA"
              type="video/mp4"
              width="100%"
              height="100%"
              className="w-full h-full"
            />
          </div>
        </div>
        <Spacer />
        <Description center>
          Preparate con expertos y recibí feedback para mejorar.
          <br />4 expertos • Soft &amp; hard skills • Inglés • On-demand
        </Description>
        <Spacer size="lg" />
        <CallToAction />
      </Section>

      <Divider />

      <Section>
        <Heading size="sm" center>
          Las ventajas de tener un <span className="text-primary">Mentor</span>
        </Heading>
        <Spacer />
        <Description center className="text-base text-muted-foreground mb-4">
          Llegá con más seguridad a las entrevistas
        </Description>
        <Spacer />
        <Grid>
          {benefits.map((data, index) => (
            <Card key={index} className="border-none">
              <CardHeader className="flex flex-row items-center gap-4">
                <data.icon className="h-full w-1/4" strokeWidth={0.75} />
                <div className="flex flex-col w-full">
                  <CardTitle className="text-primary text-xl sm:text-2xl">
                    {data.title}
                  </CardTitle>
                  <CardDescription>{data.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </Grid>
      </Section>

      <Divider />

      <Section>
        <Heading size="sm" center>
          ¿Cómo funciona?
        </Heading>
        <Spacer />
        <Description center className="text-base text-muted-foreground mb-4">
          Los mentores trabajan por sesión, ayudandote puntualmente en tus
          necesidades.
        </Description>
        <Spacer />
        <div className="flex flex-col gap-4 max-w-prose mx-auto">
          {steps.map((step, i) => (
            <Card
              key={i}
              className={`flex-row flex items-center ${spaceSizes.sm.gap} ${spaceSizes.sm.py} ${spaceSizes.sm.px}`}
            >
              <div className="rounded-full bg-secondary text-secondary-foreground size-8 flex items-center justify-center font-bold aspect-square">
                {i + 1}
              </div>
              <span>{step}</span>
            </Card>
          ))}
          <Card
            className={`flex-row flex items-center ${spaceSizes.sm.gap} ${spaceSizes.sm.py} ${spaceSizes.sm.px} border-primary relative border-3`}
          >
            <div className="absolute -top-3 -right-6 bg-primary text-primary-foreground px-4 py-1 transform rotate-45 rounded-full">
              FREE
            </div>
            <div className="rounded-full bg-primary text-secondary-foreground size-8 flex items-center justify-center font-bold aspect-square p-2">
              <Trophy />
            </div>
            <span>
              Si conseguís trabajo con Silver.dev podés recuperar hasta $1000
              que hayas invertido en preparación para entrevistas.{" "}
              <Link
                href="https://silver.dev/ed"
                target="_blank"
                className="underline hover:opacity-75 duration-200"
              >
                Más info
              </Link>
              .
            </span>
          </Card>
        </div>
      </Section>

      <Divider />

      <Section id="testimonials">
        <Heading size="sm" center>
          Testimonios
        </Heading>
        <Spacer />
        <Description center className="text-base text-muted-foreground mb-4">
          Sumate a quienes ya lo hicieron
        </Description>
        <Spacer />
        <TestimonialsCarousel />
      </Section>

      <Divider />

      <Section id="our-mentors">
        <Heading size="sm" center>
          Nuestros Equipo de Mentores
        </Heading>
        <Spacer />
        <Description center>
          Expertos al nivel de entrevistadores reales
        </Description>
        <Spacer size="lg" />
        <Grid>
          {mentors.map((mentor) => (
            <Card key={mentor.name} className="flex flex-col">
              <CardHeader className="gap-3">
                <div
                  className={`flex flex-row items-center ${spaceSizes.sm.gap}`}
                >
                  <Avatar className="size-16">
                    <AvatarImage
                      src={mentor.image || "/placeholder.svg"}
                      alt={mentor.name}
                    />
                    <AvatarFallback>
                      {mentor.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{mentor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mentor.title}
                    </p>
                  </div>
                </div>
                <CardDescription className="text-foreground text-base">
                  {mentor.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                <span className="flex text-xl sm:text-2xl items-center gap-1.5">
                  <Target />
                  {mentor.target}
                </span>
              </CardFooter>
            </Card>
          ))}
        </Grid>
        <Spacer size="lg" />
        <CallToAction />
      </Section>
    </>
  );
}

function CallToAction() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <Button size="lg" className="uppercase" asChild>
        <Link href="https://docs.google.com/forms/d/15He4sNXmaNlY1EGtJooVDDKN-4hlWzVIjQAVoF4VkkE/viewform">
          Aplicar al programa
        </Link>
      </Button>
      <Button variant="link" size="lg" asChild>
        <Link
          target="_blank"
          href="https://silverdev.notion.site/Interview-Mentors-Terms-Conditions-Signup-14f950a2e42c8058adc2c59c6e02ab86"
        >
          Términos y Condiciones
        </Link>
      </Button>
    </div>
  );
}
