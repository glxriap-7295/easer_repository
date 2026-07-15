"use client";
import { useState } from "react";
import { Card, Button, Input, Textarea, Field } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { EASER_INFO } from "@/lib/constants";
import { SocialLinks } from "@/components/SocialLinks";

export default function ContactPage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const set = (k: keyof typeof f) => (e: any) => setF((s) => ({ ...s, [k]: e.target.value }));

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = `${f.message}\n\n— ${f.name} (${f.email})`;
    window.location.href = `mailto:${EASER_INFO.contact}?subject=${encodeURIComponent(f.subject || "EASER enquiry")}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-stone-900">{L === "es" ? "Contacto" : "Contact"}</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        {L === "es"
          ? "¿Colaboraciones, prensa o consultas? Escríbenos y el equipo EASER responderá a la brevedad."
          : "Collaborations, press or enquiries? Send us a message and the EASER team will get back to you."}
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.3fr]">
        {/* Contact info */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Email</p>
            <a href={`mailto:${EASER_INFO.contact}`} className="mt-1 block text-sm font-medium text-accent-700 hover:underline">{EASER_INFO.contact}</a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Dirección" : "Address"}</p>
            <p className="mt-1 text-sm text-stone-700">Universidad de Concepción<br />{L === "es" ? "Concepción, Chile" : "Concepción, Chile"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Síguenos" : "Follow us"}</p>
            <SocialLinks className="mt-2" />
          </div>
          <div className="overflow-hidden rounded-xl border border-stone-200">
            <iframe
              title="Universidad de Concepción"
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Universidad%20de%20Concepci%C3%B3n&output=embed" />
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={send} className="grid gap-4">
            <Field label={L === "es" ? "Nombre" : "Name"} required><Input value={f.name} onChange={set("name")} placeholder={L === "es" ? "Tu nombre" : "Your name"} required /></Field>
            <Field label="Email" required><Input type="email" value={f.email} onChange={set("email")} placeholder={L === "es" ? "Tu correo" : "Your email"} required /></Field>
            <Field label={L === "es" ? "Asunto" : "Subject"}><Input value={f.subject} onChange={set("subject")} placeholder={L === "es" ? "¿En qué podemos ayudarte?" : "How can we help?"} /></Field>
            <Field label={L === "es" ? "Mensaje" : "Message"} required><Textarea rows={6} value={f.message} onChange={set("message")} placeholder={L === "es" ? "Tu mensaje" : "Your message"} required /></Field>
            <div><Button type="submit">{L === "es" ? "Enviar mensaje" : "Send message"}</Button></div>
          </form>
        </Card>
      </div>
    </div>
  );
}
