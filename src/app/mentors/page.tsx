import Description from "@/components/description";
import Divider from "@/components/divider";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import { Aleph, Ebay, Gerald, LinkedIn } from "@/components/logos";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  BriefcaseBusiness,
  CircleFadingArrowUp,
  HeartHandshake,
  Keyboard,
} from "lucide-react";
import Image from "next/image";
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
  "Elegí el experto que mejor se adapte a tus necesidades",
  "Agendá una sesión y compartí tus necesidades para que podamos preparar el contenido",
  "Hacé la sesión y recibí feedback en tiempo real",
  "Recibí un resumen de la sesión y una lista de próximos pasos para que puedas seguir practicando",
];

const testimonials = [
  {
    name: "Matías Saguir",
    role: "Sr. Software Engineer",
    quote:
      "Con Marcel logré sentirme seguro a la hora de interactuar en entrevistas. Pudo entender lo que necesitaba aprender para lograr mis objetivos profesionales y fue clave para poder transmitir mi forma de ser y expresarme de forma genuina.",
    link: "https://www.linkedin.com/in/matiassaguir",
    photo: "/mentors/testimonials/matias.jpeg",
    company: Gerald,
  },
  {
    name: "Martín Sione",
    role: "Software Engineer",
    quote:
      "La experiencia de Gabriel en empresas americanas de producto me ayudó a saber qué es lo que tenía que destacar de mi perfil. Es muy valioso tener a alguien que realmente trabajó en la industria y participó de procesos de hiring.",
    link: "https://www.linkedin.com/in/martinsione/",
    photo: "/mentors/testimonials/martin.jpeg",
    company: Aleph,
  },
  {
    name: "Francisco Erramuspe",
    role: "Software Engineer",
    quote:
      "Gracias a la mentoría con Mariano pude conseguir ofertas de Walmart, eBay y Google. Me ayudó mucho a mejorar mis problem solving skills de cara a las entrevistas técnicas así como a manejar situaciones de ambigüedad y presión. No podría haber logrado esos resultados sin él: su ayuda fue fundamental para pasar muchas rondas de entrevista.",
    link: "https://www.linkedin.com/in/francisco-erramuspe/",
    photo: "/mentors/testimonials/francisco.jpeg",
    company: Ebay,
  },
];

const mentors = [
  {
    name: "Mariano Crosetti",
    title: "ICPC Coach - Ex-Google",
    price: "$75",
    linkedin: "https://www.linkedin.com/in/marianocrosetti/",
    calendly: "https://calendly.com/marianojosecrosetti/interview-prep",
    description:
      "Con mi entrenamiento los candidatos han pasado procesos en Google, Amazon y Microsoft USA. Soy campeón de programación competitiva LatAm y coach de numerosos finalistas mundiales. He desarrollado un método para que cualquier candidato pueda adquirir nivel top-global en entrevistas de LeetCode (Data Structures and Algorithms).",
    image: "/mentors/mariano.jpeg",
  },
  {
    name: "Gabriel Benmergui",
    title: "Silver.dev Founder – Staff Engineer",
    price: "$200",
    linkedin: "https://www.linkedin.com/in/gabriel-benmergui/",
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
        <div className="flex justify-center">
          <Button size="lg" asChild>
            <Link href="#our-mentors">AGENDAR SESIÓN</Link>
          </Button>
        </div>
      </Section>

      <Divider />

      <Section>
        <Heading size="sm" center>
          Beneficios
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
          Un proceso simple diseñado para maximizar tu éxito en entrevistas
        </Description>
        <Spacer />
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {steps.map((step, i) => (
            <Card
              key={i}
              className="flex-row flex items-center gap-4 px-6 py-4"
            >
              <div className="rounded-full bg-secondary text-secondary-foreground w-8 h-8 flex items-center justify-center font-bold aspect-square">
                {i + 1}
              </div>
              <span>{step}</span>
            </Card>
          ))}
        </div>
      </Section>

      <Divider />

      <section>
        <Heading size="sm" center>
          Testimonios
        </Heading>
        <Spacer />
        <Description center className="text-base text-muted-foreground mb-4">
          Sumate a quienes ya lo hicieron
        </Description>
        <Spacer />
        <Carousel
          opts={{
            breakpoints: { "(min-width: 1280px)": { active: false } },
            align: "center",
            loop: true,
            slidesToScroll: 1,
            containScroll: false,
          }}
          className="w-full"
        >
          <CarouselContent className="xl:justify-center">
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={index}
                className="basis-10/12 sm:basis-4/5 md:basis-3/5 lg:basis-2/5 xl:basis-1/4"
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardDescription>
                      <div className="flex italic">
                        <span className="text-4xl leading-none mr-2">
                          &ldquo;
                        </span>
                        {testimonial.quote}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <Link
                      href={testimonial.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 w-full group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 aspect-square">
                          <AvatarImage
                            src={testimonial.photo}
                            alt={testimonial.name}
                          />
                          <AvatarFallback>
                            {testimonial.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <h1 className="font-medium text-sm flex gap-1 items-center underline underline-offset-4 decoration-transparent group-hover:decoration-foreground duration-200">
                            <LinkedIn className="size-4 fill-foreground" />
                            {testimonial.name}
                          </h1>
                          <p className="text-xs text-muted-foreground">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                      <testimonial.company className="fill-foreground w-16" />
                    </Link>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <Spacer />
          <div className="flex justify-center gap-2 xl:hidden">
            <CarouselPrevious className="static transform-none translate-none" />
            <CarouselNext className="static transform-none translate-none" />
          </div>
        </Carousel>
      </section>

      <Divider />

      <Section id="our-mentors">
        <Heading size="sm" center>
          Nuestros Mentores
        </Heading>
        <Spacer />
        <Description center className="text-base text-muted-foreground mb-4">
          Expertos al nivel de entrevistadores reales
        </Description>
        <Spacer />
        <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {mentors.map((m) => (
            <Card key={m.name} className="h-full flex flex-col">
              <CardHeader className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted mb-2 flex items-center justify-center">
                  <Image src={m.image} alt={m.name} width={96} height={96} />
                </div>
                <CardTitle className="text-center">{m.name}</CardTitle>
                <CardDescription className="text-center text-sm">
                  {m.title}
                </CardDescription>
              </CardHeader>
              <CardContent>{m.description}</CardContent>
              <CardFooter className="flex flex-col mt-auto">
                <div className="flex justify-between w-full items-center">
                  <span className="text-lg">
                    <span className="font-bold text-primary">{m.price}</span>
                    <span className="text-muted-foreground">/hora</span>
                  </span>
                  {m.linkedin && (
                    <Link
                      href={m.linkedin}
                      target="_blank"
                      className="text-xs underline text-muted-foreground hover:opacity-75 duration-200"
                    >
                      LinkedIn
                    </Link>
                  )}
                </div>
                <Spacer />
                <Button size="sm" className="w-full" asChild>
                  <Link href={m.calendly} target="_blank">
                    AGENDAR SESIÓN
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      </Section>
    </>
  );
}
