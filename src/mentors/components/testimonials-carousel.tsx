"use client";

import {
  Aleph,
  Ebay,
  Gerald,
  LinkedIn,
  Sirvana,
  Vercel,
} from "@/components/logos";
import { spaceSizes } from "@/components/spacer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import React from "react";

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
  {
    name: "Santiago Ruberto",
    role: "CEO",
    quote:
      "[...] Antes de conocer a Mars, no tenía la confianza para tener reuniones en inglés sin haber memorizado o preparado cada pregunta y respuesta. Después de las clases con él, empecé a sentirme igual de cómodo hablando en inglés que en español. Su ayuda fue clave para que lográramos levantar más de USD $650,000 de inversores estadounidenses.",
    link: "https://www.linkedin.com/in/santiagoruberto",
    photo: "/mentors/testimonials/ruberto.jpeg",
    company: Sirvana,
  },
  {
    name: "Nicolas Montone",
    role: "Product Engineer",
    quote:
      "Marcel no solo es un English Coach que me ayudó a mejorar mi inglés en menos de dos semanas y sentirme más seguro, sino que me ayudó a desenvolver mis historias, entender qué quiero contar y cómo hacerlo. Pudo identificar muy rápido mis puntos débiles (y fuertes) y darme las herramientas necesarias que mejoraron mi storytelling y mi speech.",
    link: "https://www.linkedin.com/in/nicolas-montone",
    photo: "/mentors/testimonials/montone.jpeg",
    company: Vercel,
  },
];

export function TestimonialsCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      opts={{
        align: "center",
        loop: true,
      }}
    >
      <CarouselContent>
        {testimonials.map((testimonial, index) => (
          <CarouselItem
            key={index}
            className={`lg:basis-1/3 ${spaceSizes.sm.pl}`}
          >
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardDescription>
                  <div className="flex italic">
                    <span className="text-4xl leading-none mr-2">&ldquo;</span>
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
                  {testimonial.company && (
                    <testimonial.company className="fill-foreground max-w-16 h-6" />
                  )}
                </Link>
              </CardFooter>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="hidden md:block">
        <CarouselPrevious onMouseDown={() => plugin.current.stop()} />
        <CarouselNext onMouseDown={() => plugin.current.stop()} />
      </div>
    </Carousel>
  );
}
