import Hero from "../components/landing/Hero";
import { AboutSection } from "./about/components/AboutSection";
import RegistrationStepsSection from "../components/landing/RegistrationStepsSection";
import NewsHighlightSection from "../components/landing/NewsHighlightSection";
import VoteHighlightSection from "../components/landing/VoteHighlightSection";
import SponsorSection from "../components/landing/SponsorSection";
import FAQList from "./faq/components/FAQList";

/**
 * Halaman beranda utama.
 * Menyusun section landing (hero, about, sponsor, tahapan, news, vote, dan FAQ ringkas).
 */
export default function HomePage() {
  return (
    <div className="home-page">
      <section id="hero">
        <Hero />
      </section>

      <div className="warm-champagne-bg">
        <AboutSection />

        <SponsorSection />

        <RegistrationStepsSection />

        <NewsHighlightSection />

        <VoteHighlightSection />

        <section id="faq" className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p
                className="text-sm tracking-widest uppercase mb-3"
                style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
              >
                Bantuan
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
                FAQ
              </h2>
            </div>
            <FAQList limit={5} />
          </div>
        </section>
      </div>
    </div>
  );
}


