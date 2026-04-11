import FeedbackForm from "./components/FeedbackForm";

/**
 * Halaman feedback publik.
 * Menampilkan konteks masukan pengguna dan form pengiriman kritik/saran/pertanyaan.
 */
export default function FeedbackPage() {
  return (
    <section
      className="min-h-[calc(100vh-80px)] py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
     
    >
      <div className="max-w-5xl mx-auto">
        <p
          className="text-sm tracking-widest uppercase mb-3"
          style={{ color: "#C8A24D", fontFamily: "var(--font-cinzel)" }}
        >
          Masukan Pengguna
        </p>

        <h1
          className="mb-3"
          style={{
            fontFamily: "var(--font-cinzel)",
            background: "linear-gradient(135deg, #F5D06F, #C8A24D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            fontWeight: 700,
          }}
        >
          FEEDBACK & SARAN
        </h1>

        <p
          className="mb-8 text-sm"
          style={{ color: "#BDBDBD", fontFamily: "var(--font-poppins)" }}
        >
          Kirim kritik, saran, atau pertanyaan untuk membantu peningkatan layanan
          platform Duta Wisata Kota Batam.
        </p>

        <FeedbackForm />
      </div>
    </section>
  );
}


