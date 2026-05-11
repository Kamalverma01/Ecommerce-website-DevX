import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Link } from "react-router-dom";
import { Mail, Phone, Loader2 } from "lucide-react";
import myLogo from "../../assets/pscwhitelogo.png";

function Contact() {
  const form = useRef();

  const [loading, setLoading] = useState(false);

  // Temporary Email Domains
  const tempDomains = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "yopmail.com",
    "trashmail.com",
    "fakeinbox.com",
  ];

  const sendEmail = async (e) => {
    e.preventDefault();

    const formData = new FormData(form.current);

    const email = formData.get("user_email")?.trim();

    // Email Regex Validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Invalid Email
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Temporary Email Check
    const domain = email.split("@")[1]?.toLowerCase();

    if (tempDomains.includes(domain)) {
      alert("Temporary email addresses are not allowed.");
      return;
    }

    try {
      setLoading(true);

      const result = await emailjs.sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        form.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      console.log("SUCCESS:", result.text);

      alert("Message sent successfully!");

      form.current.reset();
    } catch (error) {
      console.error("EMAILJS ERROR:", error);

      alert(
        error?.text ||
          "Failed to send message. Check EmailJS configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side */}
        <div>
          <img
            src={myLogo}
            alt="PSC Logo"
            className="w-28 mb-6"
          />

          <h1 className="text-5xl font-bold leading-tight">
            Contact Us
          </h1>

          <p className="mt-4 text-gray-600 text-lg">
            We'd love to hear from you.
            Send us a message and we’ll respond soon.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={20} />
              <span>Devantrax@gmail.com</span>
            </div>

            {/* <div className="flex items-center gap-3">
              <Phone size={20} />
              <span>+91 98765 43210</span>
            </div> */}
          </div>

          <Link
            to="/"
            className="inline-block mt-8 text-sm font-semibold border-b border-black"
          >
            Back Home
          </Link>
        </div>

        {/* Right Side */}
        <div className="border border-gray-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">
            Send Message
          </h2>

          <form
            ref={form}
            onSubmit={sendEmail}
            className="space-y-5"
          >
            {/* Name */}
            <input
              type="text"
              name="user_name"
              placeholder="Your Name"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black transition"
            />

            {/* Email */}
            <input
              type="email"
              name="user_email"
              placeholder="Email Address"
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black transition"
            />

            {/* Message */}
            <textarea
              rows={5}
              name="message"
              placeholder="Your Message"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black transition resize-none"
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Contact;