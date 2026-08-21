export default function DecorationBlood() {
  return (
    <svg
      viewBox="0 0 520 300"
      fill="none"
      className="h-full w-full"
      role="img"
      aria-label="An animated heartbeat line resolving into a network of connected donors"
    >
      <defs>
        <linearGradient id="pulseFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C81E3A" stopOpacity="0" />
          <stop offset="12%" stopColor="#C81E3A" stopOpacity="1" />
          <stop offset="88%" stopColor="#C81E3A" stopOpacity="1" />
          <stop offset="100%" stopColor="#C81E3A" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4B740" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F4B740" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* heartbeat line */}
      <path
        d="M0,150 L110,150 L135,150 L150,90 L168,220 L188,60 L206,150 L240,150 L262,150 L282,110 L300,150 L520,150"
        stroke="url(#pulseFade)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="rc-pulse-path"
      />

      {/* network nodes branching off the line's resting point */}
      <g className="rc-nodes">
        <circle cx="300" cy="150" r="14" fill="#F4B740" opacity="0.14" />
        <circle cx="300" cy="150" r="4" fill="#F4B740" />

        <line x1="300" y1="150" x2="368" y2="96" stroke="#F3EDE7" strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="300" y1="150" x2="392" y2="176" stroke="#F3EDE7" strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="300" y1="150" x2="340" y2="228" stroke="#F3EDE7" strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="368" y1="96" x2="446" y2="70" stroke="#F3EDE7" strokeOpacity="0.12" strokeWidth="1.5" />
        <line x1="392" y1="176" x2="466" y2="150" stroke="#F3EDE7" strokeOpacity="0.12" strokeWidth="1.5" />

        <g className="rc-node rc-node-1">
          <circle cx="368" cy="96" r="18" fill="url(#nodeGlow)" />
          <circle cx="368" cy="96" r="5" fill="#F3EDE7" />
        </g>
        <g className="rc-node rc-node-2">
          <circle cx="392" cy="176" r="18" fill="url(#nodeGlow)" />
          <circle cx="392" cy="176" r="5" fill="#F3EDE7" />
        </g>
        <g className="rc-node rc-node-3">
          <circle cx="340" cy="228" r="18" fill="url(#nodeGlow)" />
          <circle cx="340" cy="228" r="5" fill="#F3EDE7" />
        </g>
        <g className="rc-node rc-node-4">
          <circle cx="446" cy="70" r="14" fill="url(#nodeGlow)" />
          <circle cx="446" cy="70" r="3.5" fill="#F3EDE7" />
        </g>
        <g className="rc-node rc-node-5">
          <circle cx="466" cy="150" r="14" fill="url(#nodeGlow)" />
          <circle cx="466" cy="150" r="3.5" fill="#F3EDE7" />
        </g>
      </g>
    </svg>
  );
}