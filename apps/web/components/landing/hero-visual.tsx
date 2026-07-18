const PIN_COLORS = {
  coral: {
    dot: "#ff7a5c",
    ping: "rgba(255,122,92,0.55)",
    glow: "0 0 10px rgba(255,122,92,0.9), 0 0 0 2px rgba(255,255,255,0.85)",
  },
  gold: {
    dot: "#ffc164",
    ping: "rgba(255,193,100,0.6)",
    glow: "0 0 12px rgba(255,193,100,1), 0 0 0 2px rgba(255,255,255,0.9)",
  },
} as const;

const PINS = [
  { id: "medan", left: "12.5%", top: "25%", color: "coral", size: 11, ringSize: 14, delay: "0s" },
  {
    id: "jakarta",
    left: "29%",
    top: "70.5%",
    color: "gold",
    size: 13,
    ringSize: 16,
    delay: "0.3s",
    primary: true,
  },
  {
    id: "surabaya",
    left: "46%",
    top: "72%",
    color: "coral",
    size: 11,
    ringSize: 14,
    delay: "0.9s",
  },
  {
    id: "denpasar",
    left: "57%",
    top: "75%",
    color: "coral",
    size: 10,
    ringSize: 14,
    delay: "1.4s",
  },
  {
    id: "balikpapan",
    left: "56.5%",
    top: "50%",
    color: "coral",
    size: 10,
    ringSize: 14,
    delay: "0.6s",
  },
  {
    id: "makassar",
    left: "69%",
    top: "56.5%",
    color: "coral",
    size: 11,
    ringSize: 14,
    delay: "1.1s",
  },
  {
    id: "jayapura",
    left: "91%",
    top: "54%",
    color: "coral",
    size: 10,
    ringSize: 14,
    delay: "1.8s",
  },
] satisfies ReadonlyArray<{
  id: string;
  left: string;
  top: string;
  color: keyof typeof PIN_COLORS;
  size: number;
  ringSize: number;
  delay: string;
  primary?: boolean;
}>;

const FLOATING_CARDS = [
  {
    initial: "N",
    avatarColor: "#5b4bd6",
    title: "Frontend Engineer",
    location: "Jakarta · Remote",
    position: "left-[4%] top-[58%]",
    duration: "6s",
    delay: "0s",
  },
  {
    initial: "L",
    avatarColor: "#db2777",
    title: "Product Designer",
    location: "Makassar · Hybrid",
    position: "right-[1%] top-[20%]",
    duration: "7s",
    delay: "-2.5s",
  },
] as const;

export function HeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-[560px] aspect-[600/380] [filter:drop-shadow(0_14px_26px_rgba(2,18,24,0.45))]"
    >
      <svg viewBox="0 0 600 380" className="block w-full h-full overflow-visible">
        <title>Decorative hero illustration</title>
        <defs>
          <linearGradient id="isl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd587" />
            <stop offset="1" stopColor="#ef9f3c" />
          </linearGradient>
        </defs>

        <line x1="20" y1="120" x2="580" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="20" y1="200" x2="580" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="20" y1="280" x2="580" y2="280" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        <g
          fill="none"
          stroke="#ffc977"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
          strokeDasharray="3 9"
        >
          <path d="M175,268 Q70,150 75,95" className="animate-[hatch-dash_5s_linear_infinite]" />
          <path d="M175,268 Q300,150 415,215" className="animate-[hatch-dash_6s_linear_infinite]" />
          <path d="M175,268 Q360,120 545,205" className="animate-[hatch-dash_7s_linear_infinite]" />
        </g>

        <g fill="url(#isl)" stroke="rgba(255,233,190,0.5)" strokeWidth="1">
          <g className="animate-[hatch-drift_9s_ease-in-out_infinite]">
            {/* Sumatra */}
            <path d="M62,72 C92,60 112,92 122,122 C137,162 152,192 142,222 C134,242 110,236 95,210 C74,180 54,150 49,114 C45,90 47,80 62,72 Z" />
          </g>
          <g
            className="animate-[hatch-drift_11s_ease-in-out_infinite]"
            style={{ animationDelay: "-3s" }}
          >
            {/* Borneo / Kalimantan */}
            <path d="M250,108 C292,92 342,100 368,130 C388,156 382,196 356,216 C330,236 285,233 261,210 C240,189 233,158 239,133 C242,120 244,112 250,108 Z" />
            {/* Java */}
            <path d="M140,262 C190,252 250,256 300,266 C313,268 313,283 298,285 C250,291 190,289 150,283 C135,281 129,266 140,262 Z" />
            {/* Bali / Nusa Tenggara */}
            <ellipse cx="322" cy="282" rx="11" ry="7" />
            <ellipse cx="348" cy="287" rx="13" ry="6" />
            <ellipse cx="380" cy="289" rx="15" ry="6" />
            <ellipse cx="410" cy="291" rx="10" ry="5" />
          </g>
          <g
            className="animate-[hatch-drift_10s_ease-in-out_infinite]"
            style={{ animationDelay: "-6s" }}
          >
            {/* Sulawesi */}
            <path d="M406,134 C416,124 427,134 423,150 C421,165 433,176 441,166 C451,154 466,160 459,176 C451,193 436,200 433,219 C431,236 416,241 411,225 C407,212 417,200 411,188 C405,176 393,180 393,165 C393,150 397,142 406,134 Z" />
            {/* Maluku */}
            <ellipse cx="462" cy="202" rx="8" ry="7" />
            <ellipse cx="470" cy="228" rx="7" ry="6" />
            {/* Papua */}
            <path d="M486,164 C521,149 566,158 586,186 C599,204 591,236 563,246 C536,255 501,251 486,233 C475,219 471,196 476,181 C479,172 481,168 486,164 Z" />
          </g>
        </g>
      </svg>

      {/* live stat chip */}
      <div className="absolute left-[2%] top-[3%] flex items-center gap-[9px] rounded-[14px] border border-white/[0.14] bg-[#08262e]/72 px-[15px] py-[9px] backdrop-blur-[8px]">
        <span className="size-2 rounded-full bg-[#36d6a6] shadow-[0_0_0_3px_rgba(54,214,166,0.25)]" />
        <span className="text-sm font-bold text-[#f7f1e3]">12,480+</span>
        <span className="text-[13px] font-semibold text-[#bcd2d3]">live jobs</span>
      </div>

      {PINS.map((pin) => {
        const palette = PIN_COLORS[pin.color];
        return (
          <div
            key={pin.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pin.left, top: pin.top, zIndex: pin.primary ? 3 : undefined }}
          >
            <div
              className="absolute top-1/2 left-1/2 animate-[hatch-ping_2.8s_ease-out_infinite] rounded-full"
              style={{
                width: pin.ringSize,
                height: pin.ringSize,
                margin: `${-pin.ringSize / 2}px 0 0 ${-pin.ringSize / 2}px`,
                background: palette.ping,
                animationDelay: pin.delay,
              }}
            />
            <div
              className="relative rounded-full"
              style={{
                width: pin.size,
                height: pin.size,
                background: palette.dot,
                boxShadow: palette.glow,
              }}
            />
          </div>
        );
      })}

      {FLOATING_CARDS.map((card) => (
        <div
          key={card.title}
          className={`absolute ${card.position} w-[172px] rounded-[14px] border border-white/[0.14] bg-[#08262e]/82 p-[11px_13px] shadow-[0_14px_30px_rgba(2,18,24,0.4)] backdrop-blur-[8px]`}
          style={{
            animation: `hatch-bob ${card.duration} ease-in-out infinite`,
            animationDelay: card.delay,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex size-[26px] shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold text-white"
              style={{ background: card.avatarColor }}
            >
              {card.initial}
            </div>
            <div className="min-w-0">
              <div className="overflow-hidden text-[13px] font-bold text-[#f7f1e3] text-ellipsis whitespace-nowrap">
                {card.title}
              </div>
              <div className="text-[11px] font-semibold text-[#9fbabb]">{card.location}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
