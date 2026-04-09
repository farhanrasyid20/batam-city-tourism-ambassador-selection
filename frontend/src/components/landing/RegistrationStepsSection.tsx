"use client";

import Link from "next/link";
import { useLandingPageContent } from "../../lib/landing-page-content";

export default function RegistrationStepsSection() {
  const registrationContent = useLandingPageContent().registration;

  return (
    <section id="registration" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p
            className="text-sm tracking-widest uppercase mb-3"
            style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
          >
            {registrationContent.sectionLabel}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cinzel)",
              background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontSize: "clamp(1.8rem, 4vw, 2.7rem)",
              fontWeight: 700,
            }}
          >
            {registrationContent.sectionTitle}
          </h2>
          <div
            className="w-24 h-[2px] mx-auto mt-4"
            style={{
              background: "linear-gradient(90deg, transparent, #C8A24D, transparent)",
            }}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "#1A1A1A",
              border: "1px solid rgba(200,162,77,0.25)",
            }}
          >
            <h3
              className="mb-5"
              style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}
            >
              {registrationContent.stepsTitle}
            </h3>

            <div className="space-y-3">
              {registrationContent.steps.map((step, index) => (
                <div
                  key={`${step}-${index}`}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: "rgba(200,162,77,0.08)",
                    border: "1px solid rgba(200,162,77,0.2)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                      color: "#0F0F0F",
                      fontFamily: "var(--font-cinzel)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <p style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)" }}>{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-5 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
                  color: "#0F0F0F",
                  fontFamily: "var(--font-cinzel)",
                }}
              >
                {registrationContent.registerButtonLabel}
              </Link>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "#1A1A1A",
              border: "1px solid rgba(200,162,77,0.25)",
            }}
          >
            <h3
              className="mb-5"
              style={{ color: "#F5D06F", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}
            >
              {registrationContent.scheduleTitle}
            </h3>
            <div className="space-y-3">
              {registrationContent.scheduleItems.map((item, index) => (
                <div
                  key={item.id || `${item.activity}-${index}`}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(200,162,77,0.08)",
                    border: "1px solid rgba(200,162,77,0.2)",
                  }}
                >
                  <p
                    className="text-sm"
                    style={{ color: "#F5E6C8", fontFamily: "var(--font-poppins)", fontWeight: 600 }}
                  >
                    {item.activity}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#C8A24D", fontFamily: "var(--font-poppins)" }}>
                    {item.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
