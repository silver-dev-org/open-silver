import Description from "@/components/description";
import Divider from "@/components/divider";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";

const benefits = [
  {
    title: "Superá tus límites y dejá de pasarla mal",
    description:
      "Entrevistar cuando no te sentís cómodo genera tensión, pero ahora vas a poder simular entrevistas reales y recibir feedback de expertos para mejorar.",
  },
  {
    title: "Mejorá tu performance en entrevistas técnicas",
    description:
      "La clave para pasar entrevistas técnicas es llegar con horas de práctica. Ahora también vas a poder sumar el feedback de mentores expertos que te ayudan en el entrenamiento.",
  },
  {
    title: "Destacate y enamorá al entrevistador",
    description:
      "Recruiters y hiring managers entrevistan cientos de candidatos. Destacarte hace que dejes de ser uno más, y te ayuda no sólo a pasar una instancia sino a avanzar en el proceso.",
  },
  {
    title: "Conseguí el trabajo que querés",
    description:
      "Cuanto mejor entrevistes, más ofertas vas a conseguir. Las mock interviews te ayudan a corregir errores por anticipado, llegar con más seguridad y romperla en el momento de la verdad.",
  },
];

const steps = [
  "Elegí el experto que mejor se adapte a tus necesidades",
  "Agendá una sesión y compartí tus necesidades para que podamos preparar el contenido",
  "Hacé la sesión y recibí feedback en tiempo real",
  "Recibí un resumen de la sesión y una lista de próximos pasos para que puedas seguir practicando",
];

const testimonials = [
  {
    name: "Matías Saguir",
    role: "Sr. Software Engineer",
    text: "Con Marcel logré sentirme seguro a la hora de interactuar en entrevistas. Pudo entender lo que necesitaba aprender para lograr mis objetivos profesionales y fue clave para poder transmitir mi forma de ser y expresarme de forma genuina.",
    initials: "MS",
  },
  {
    name: "Martín Sione",
    role: "Software Engineer",
    text: "La experiencia de Gabriel en empresas americanas de producto me ayudó a saber qué es lo que tenía que destacar de mi perfil. Es muy valioso tener a alguien que realmente trabajó en la industria y participó de procesos de hiring.",
    initials: "MS",
  },
  {
    name: "Francisco Erramuspe",
    role: "Software Engineer",
    text: "Gracias a la mentoría con Mariano pude conseguir ofertas de Walmart, eBay y Google. Me ayudó mucho a mejorar mis problem solving skills de cara a las entrevistas técnicas así como a manejar situaciones de ambigüedad y presión. No podría haber logrado esos resultados sin él: su ayuda fue fundamental para pasar muchas rondas de entrevista.",
    initials: "FE",
  },
];

const mentors = [
  {
    name: "Mariano Crosetti",
    title: "ICPC Coach - Ex-Google",
    price: "$75",
    linkedin: "https://www.linkedin.com/in/mariano-crosetti/",
    calendly: "https://calendly.com/marianojosecrosetti/interview-prep",
    description:
      "Con mi entrenamiento los candidatos han pasado procesos en Google, Amazon y Microsoft USA. Soy campeón de programación competitiva LatAm y coach de numerosos finalistas mundiales. He desarrollado un método para que cualquier candidato pueda adquirir nivel top-global en entrevistas de LeetCode (Data Structures and Algorithms).",
    image: "/mentors/mariano.png",
  },
  {
    name: "Gabriel Benmergui",
    title: "Silver.dev Founder – Staff Engineer",
    price: "$200",
    linkedin: "https://www.linkedin.com/in/gabrielbenmergui/",
    calendly: "https://calendly.com/silver-dev/silver-dev-coaching-session",
    description:
      "Como recruiter y programador te puedo ayudar a entender donde estás parado en el mercado, cuáles son los próximos pasos y cómo pasar cualquier entrevista. Ayudé a gente a entrar en empresas de primera línea global como Google y también a fundar y escalar empresas como founder de Silver.dev.",
    image: "/mentors/gabriel.png",
  },
  {
    name: "Rodrigo Uroz",
    title: "Senior Software Engineer",
    price: "$75",
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
    calendly: "https://calendly.com/silver-dev/silver-dev-coaching-session",
    description:
      "Experienced English language coach specializing in technical interview preparation. I'll not only make English speakers understand you, but their communication skills, technical vocabulary, and confidence. I'm here to be your support for your interview journey.",
    image: "/mentors/marcel.jpg",
  },
];

export default function MentorsPage() {
  return (
    <Section>
      <Heading size="lg" center>
        Práctica de entrevistas con{" "}
        <span className="text-primary">entrevistadores</span> reales
      </Heading>
      <Spacer />
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
      <Description center>
        Preparate con expertos y recibí feedback para mejorar.
        <br />4 expertos • Soft &amp; hard skills • Inglés • On-demand
      </Description>
      <Spacer size="lg" />
      <div className="flex justify-center">
        <Button size="lg" asChild>
          <Link href="#our-mentors">AGENDAR SESIÓN</Link>
        </Button>
      </div>

      <Divider />

      <Heading size="sm" center>
        Beneficios
      </Heading>
      <Description center className="text-base text-muted-foreground mb-4">
        Llegá con más seguridad a las entrevistas
      </Description>
      <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => (
          <Card key={b.title} className="h-full">
            <CardHeader>
              <CardTitle>{b.title}</CardTitle>
              <CardDescription>{b.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Grid>

      <Divider />

      <Heading size="sm" center>
        ¿Cómo funciona?
      </Heading>
      <Spacer />
      <Description center className="text-base text-muted-foreground mb-4">
        Un proceso simple diseñado para maximizar tu éxito en entrevistas
      </Description>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        {steps.map((step, i) => (
          <Card key={i} className="flex-row flex items-center gap-4 px-6 py-4">
            <div className="rounded-full bg-secondary text-secondary-foreground w-8 h-8 flex items-center justify-center font-bold aspect-square">
              {i + 1}
            </div>
            <span>{step}</span>
          </Card>
        ))}
      </div>

      <Divider />

      <Heading size="sm" center>
        Testimonios
      </Heading>
      <Description center className="text-base text-muted-foreground mb-4">
        Sumate a quienes ya lo hicieron
      </Description>
      <div className="max-w-xl mx-auto">
        <Carousel opts={{ align: "center", loop: true }}>
          <CarouselContent>
            {testimonials.map((t, i) => (
              <CarouselItem key={i}>
                <Card className="size-full">
                  <CardHeader>
                    <CardDescription>
                      <p className="italic mb-2">“{t.text}”</p>
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                        {t.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.role}
                        </div>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <Divider />

      <section id="our-mentors">
        <Heading size="sm" center>
          Nuestros Mentores
        </Heading>
        <Description center className="text-base text-muted-foreground mb-4">
          Expertos al nivel de entrevistadores reales
        </Description>
        <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {mentors.map((m) => (
            <Card key={m.name} className="flex flex-col h-full">
              <CardHeader className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted mb-2 flex items-center justify-center">
                  <Image src={m.image} alt={m.name} width={96} height={96} />
                </div>
                <CardTitle className="text-center text-lg">{m.name}</CardTitle>
                <CardDescription className="text-center text-xs uppercase font-semibold">
                  {m.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">{m.description}</CardContent>
              <CardFooter className="flex flex-col gap-2 pt-3 mt-auto">
                <div className="flex justify-between w-full items-center">
                  <span className="text-lg">
                    <span className="font-bold text-primary">{m.price}</span>
                    <span className="text-muted-foreground">/hora</span>
                  </span>
                  {m.linkedin && (
                    <Link
                      href={m.linkedin}
                      target="_blank"
                      className="text-xs underline text-muted-foreground"
                    >
                      LinkedIn
                    </Link>
                  )}
                </div>
                <Button size="sm" className="w-full mt-2" asChild>
                  <Link href={m.calendly} target="_blank">
                    AGENDAR SESIÓN
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      </section>
    </Section>
  );
}
