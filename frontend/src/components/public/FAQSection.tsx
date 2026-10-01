"use client";

import { useState } from "react";
import RevealOnScroll from "./RevealOnScroll";

interface FAQItem {
  id: string;
  categoryEn: string;
  categoryNp: string;
  questionEn: string;
  questionNp: string;
  answerEn: string;
  answerNp: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "booking-tenants",
    categoryEn: "STAYS & RESERVATIONS",
    categoryNp: "बसाइ तथा बुकिङ",
    questionEn: "HOW DOES BOOKING ACROSS BASAI SANCTUARIES WORK?",
    questionNp: "बसाइका विभिन्न स्थानहरूमा बुकिङ कसरी गरिन्छ?",
    answerEn:
      "Basai operates an integrated boutique hospitality platform. You can reserve private suites across all our distinct properties—from the heritage brick courtyards of Kathmandu Valley to the alpine ridge retreats in Mustang and Pokhara—in a single verified booking with instant confirmation.",
    answerNp:
      "बसाइ एक एकीकृत बुटिक आतिथ्य प्रणाली हो। काठमाडौँ उपत्यकाको ऐतिहासिक सम्पदादेखि पोखरा र मुस्ताङका हिमाली लजहरूसम्मका निजी सुइटहरू तपाईं एकै स्थानबाट तुरुन्तै सुरक्षित गर्न सक्नुहुन्छ।",
  },
  {
    id: "cuisine-dining",
    categoryEn: "CULINARY & HEARTH",
    categoryNp: "भोजन तथा स्वाद",
    questionEn: "CAN NON-RESIDENT GUESTS DINE AT CHULI OR PROPERTY RESTAURANTS?",
    questionNp: "होटलमा नबस्ने पाहुनाहरूले पनि चूली रेस्टुरेन्टमा खान पाउँछन्?",
    answerEn:
      "Yes. Our hearth restaurants, tea verandas, and fireside dining rooms welcome external guests with advance table reservations. We prioritize seasonal, hyper-local ingredients foraged from surrounding valleys and organic partner orchards.",
    answerNp:
      "अवश्य पाउँछन्। हाम्रो चूली रेस्टुरेन्ट तथा खुला आगोको अँगेठो वरपरका टेबुलहरू पहिले नै सुरक्षित गरी बाह्य पाहुनाहरूले पनि अग्र्यानिक र मौलिक हिमाली स्वादको आनन्द लिन सक्नुहुन्छ।",
  },
  {
    id: "currency-payments",
    categoryEn: "PAYMENTS & BILLING",
    categoryNp: "भुक्तानी तथा विनिमय",
    questionEn: "WHICH CURRENCIES AND PAYMENT METHODS ARE ACCEPTED?",
    questionNp: "कुन-कुन मुद्रा र भुक्तानी माध्यमहरू स्वीकार गरिन्छ?",
    answerEn:
      "We accept payments in Nepali Rupee (NPR), USD, EUR, and GBP. We support direct digital payments via eSewa, Khalti, major international credit/debit cards (Visa, MasterCard, Amex), and verified wire transfers.",
    answerNp:
      "हामी नेपाली रुपैयाँ (NPR), अमेरिकी डलर (USD), युरो र पाउन्डमा भुक्तानी स्वीकार गर्छौँ। इसेवा (eSewa), खल्ती (Khalti), अन्तर्राष्ट्रिय कार्डहरू (Visa, Mastercard, Amex) तथा बैङ्क ट्रान्सफर उपलब्ध छन्।",
  },
  {
    id: "checkin-experience",
    categoryEn: "ARRIVALS & TRANSFERS",
    categoryNp: "आगमन तथा सेवा",
    questionEn: "DO YOU ARRANGE PRIVATE HIMALAYAN TRANSFERS OR EXPEDITIONS?",
    questionNp: "के तपाईंहरूले निजी हिमाली यात्रा वा यातायातको व्यवस्था गर्नुहुन्छ?",
    answerEn:
      "Each sanctuary concierge arranges private 4x4 overland transfers, chartered helicopter drops to Mustang/Pokhara, and personalized heritage walking trails led by local cultural custodians.",
    answerNp:
      "हाम्रा प्रत्येक होटलका द्वारपाल (कन्सिएर्ज) ले निजी ४x४ गाडी, मुस्ताङ तथा पोखराका लागि हेलिकप्टर चार्टर सेवा, र स्थानीय गाइडहरूसहितको सांस्कृतिक पदयात्राको प्रबन्ध गर्दछन्।",
  },
  {
    id: "sustainability",
    categoryEn: "HERITAGE & ARCHITECTURE",
    categoryNp: "संरक्षण तथा प्रकृति",
    questionEn: "WHAT IS BASAI'S COMMITMENT TO HERITAGE CONSERVATION?",
    questionNp: "सम्पदा र वातावरण संरक्षणमा बसाइको प्रतिबद्धता के छ?",
    answerEn:
      "Every Basai property preserves architectural authenticity—utilizing master woodcarvers, reclaimed brick, stone masonry, zero single-use plastics, and 100% solar and organic thermal heating systems.",
    answerNp:
      "बसाइका सबै संरचनाहरू मौलिक वास्तुकला जोगाउन समर्पित छन्—परम्परागत काष्ठकला, पुन:प्रशोधित इँटा, प्लास्टिकरहित नीति, र शतप्रतिशत सौर्य ऊर्जाको प्रयोग गरिन्छ।",
  },
];

interface FAQSectionProps {
  lang?: "en" | "np";
}

export default function FAQSection({ lang = "en" }: FAQSectionProps) {
  const [openId, setOpenId] = useState<string | null>("booking-tenants");

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="relative w-full bg-[#1A1816] text-[#EFEBE4] py-20 sm:py-28 lg:py-36 px-4 sm:px-8 lg:px-14 overflow-hidden border-t border-white/10 select-none"
    >
      <div className="max-w-5xl mx-auto">
        {/* SECTION HEADER */}
        <div className="text-center mb-14 sm:mb-20">
          <RevealOnScroll direction="up">
            <div className="flex items-center justify-center gap-2 mb-3 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E8A88A]">
              <span className="w-2 h-2 rounded-full bg-[#E8A88A]" />
              <span>05 // INQUIRIES & SANCTUARY DETAILS</span>
            </div>

            <h2
              className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-[54px] text-white tracking-wider leading-[1.08]"
              style={{ textTransform: "uppercase" }}
            >
              FREQUENTLY ASKED QUESTIONS
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-[#A8988B] max-w-xl mx-auto font-normal leading-relaxed">
              Everything you need to know about reserving suites, fireside dining, private transfers, and our architectural heritage.
            </p>
          </RevealOnScroll>
        </div>

        {/* ACCORDION CONTAINER */}
        <div className="space-y-4 sm:space-y-5">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openId === item.id;

            return (
              <RevealOnScroll key={item.id} direction="up" delay={index * 60}>
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "bg-[#25221F] border-[#E8A88A]/40 shadow-xl"
                      : "bg-[#201D1A]/80 border-white/10 hover:border-white/20 hover:bg-[#25221F]/70"
                  }`}
                >
                  {/* QUESTION BUTTON HEADER */}
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-6 sm:p-7 flex items-start justify-between gap-4 cursor-pointer focus:outline-hidden"
                  >
                    <div className="space-y-1.5 pr-2">
                      <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[#E8A88A]">
                        {item.categoryEn}
                      </span>
                      <h3
                        className="font-stedelijk uppercase text-base sm:text-xl lg:text-[21px] text-white tracking-wide leading-snug"
                        style={{ textTransform: "uppercase" }}
                      >
                        {item.questionEn}
                      </h3>
                    </div>

                    {/* EXPAND ICON INDICATOR */}
                    <div
                      className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 mt-1 ${
                        isOpen
                          ? "bg-[#E8A88A] border-[#E8A88A] text-[#1A1816] rotate-45"
                          : "border-white/20 text-white/70 hover:border-white/40"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
                      </svg>
                    </div>
                  </button>

                  {/* COLLAPSIBLE ANSWER CONTENT */}
                  <div
                    className={`transition-all duration-400 ease-out overflow-hidden ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-1 text-xs sm:text-sm text-[#C8B8AB] leading-relaxed border-t border-white/5">
                      <p>{item.answerEn}</p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* BOTTOM DIRECT CONTACT PROMPT */}
        <RevealOnScroll direction="up" delay={300}>
          <div className="mt-14 sm:mt-18 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-xs sm:text-sm text-white font-medium">
                Have a bespoke requirement or private event inquiry?
              </p>
              <p className="text-[11px] sm:text-xs text-[#8E7E73] mt-0.5">
                Our hospitality concierges are available 24/7.
              </p>
            </div>

            <a
              href="mailto:hospitality@basai.com.np"
              className="px-6 py-2.5 rounded-full border border-white/30 hover:border-[#E8A88A] hover:bg-[#E8A88A]/10 text-white hover:text-[#E8A88A] text-xs font-medium tracking-wide transition-all duration-300"
            >
              Contact Concierge
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
